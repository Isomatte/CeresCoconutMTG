<?php

namespace CeresCoconutMTG\Services;

use CeresCoconutMTG\Helpers\TrackingNormalizer;
use IO\Services\ItemListService;
use Plenty\Modules\Authorization\Services\AuthHelper;
use Plenty\Modules\Item\Variation\Contracts\VariationRepositoryContract;
use Plenty\Modules\Order\Contracts\OrderRepositoryContract;
use Plenty\Modules\Order\Shipping\ParcelService\Contracts\ParcelServicePresetRepositoryContract;
use Plenty\Modules\Plugin\Libs\Contracts\LibraryCallContract;
use Plenty\Plugin\Application;
use Plenty\Plugin\CachingRepository;
use Plenty\Plugin\ConfigRepository;
use Plenty\Plugin\Log\Loggable;

/**
 * Class ShipmentTrackingService
 *
 * Sucht die Bestellung zur Kombination Bestellnummer + PLZ, holt die Paketnummern und
 * fragt den Status bei UPS bzw. DHL ab. Ergebnis ist ein einheitliches Array fuer die
 * Sendungsverfolgungsseite.
 *
 * @package CeresCoconutMTG\Services
 */
class ShipmentTrackingService
{
    use Loggable;

    const RESULT_FOUND = 'found';
    const RESULT_NOT_FOUND = 'notFound';
    const RESULT_INVALID = 'invalid';
    const RESULT_LOCKED = 'locked';

    /** Fehlversuche je Bestellnummer, bevor die Suche gesperrt wird (Schutz vor PLZ-Raten). */
    const MAX_FAILED_ATTEMPTS = 10;
    const LOCK_MINUTES = 60;

    /** Zugestellte Pakete aendern sich nicht mehr. */
    const DELIVERED_CACHE_MINUTES = 720;
    /** Nach einem Fehler beim Paketdienst bald erneut versuchen. */
    const ERROR_CACHE_MINUTES = 2;
    const DEFAULT_CACHE_MINUTES = 15;

    const ORDER_TYPE_SALES = 1;
    const ORDER_PROPERTY_SHIPPING_PROFILE = 2;
    const ADDRESS_TYPE_BILLING = 1;
    const ADDRESS_TYPE_DELIVERY = 2;
    /** Auftragspositionen, die der Kunde sieht: Variante, Artikelpaket. */
    const ORDER_ITEM_TYPES_SHOWN = [1, 2];

    const MAX_RECOMMENDATIONS = 8;
    /** Fuer so viele bestellte Artikel werden Cross-Selling-Artikel gesucht. */
    const MAX_RECOMMENDATION_SOURCES = 3;

    const CACHE_PREFIX = 'mtgTracking_';

    /** @var ConfigRepository */
    private $config;

    /** @var CachingRepository */
    private $cache;

    /** @var TrackingNormalizer */
    private $normalizer;

    public function __construct(ConfigRepository $config, CachingRepository $cache, TrackingNormalizer $normalizer)
    {
        $this->config = $config;
        $this->cache = $cache;
        $this->normalizer = $normalizer;
    }

    /**
     * Bestellung suchen und Sendungsstatus zusammenstellen.
     *
     * Bestellnummer und PLZ muessen zusammenpassen. Ob es die Bestellnummer gibt,
     * verraet die Antwort bewusst nicht.
     *
     * @param string $orderInput
     * @param string $zipInput
     * @return array ['result' => RESULT_*, 'order' => array|null]
     */
    public function lookup(string $orderInput, string $zipInput): array
    {
        $orderId = (int)preg_replace('/\D/', '', $orderInput);
        $zip = $this->normalizeZip($zipInput);

        if ($orderId <= 0 || !strlen($zip)) {
            return ['result' => self::RESULT_INVALID, 'order' => null];
        }

        $failedKey = self::CACHE_PREFIX . 'failed_' . $orderId;
        $failedAttempts = (int)$this->cache->get($failedKey, 0);
        if ($failedAttempts >= self::MAX_FAILED_ATTEMPTS) {
            return ['result' => self::RESULT_LOCKED, 'order' => null];
        }

        $order = $this->findOrder($orderId);

        if ($order === null || !$this->orderMatchesZip($order, $zip)) {
            $this->cache->put($failedKey, $failedAttempts + 1, self::LOCK_MINUTES);
            return ['result' => self::RESULT_NOT_FOUND, 'order' => null];
        }

        return ['result' => self::RESULT_FOUND, 'order' => $this->buildOrder($order)];
    }

    /**
     * Cross-Selling-Artikel (Verknuepfung "Zubehoer") zu den bestellten Artikeln.
     *
     * @param array $order Ergebnis von lookup()
     * @return array Dokumente der Artikelsuche wie bei services.itemList.getItemList()
     */
    public function getRecommendations(array $order): array
    {
        $orderedItemIds = $order['itemIds'];
        $recommendations = [];
        $seenItemIds = $orderedItemIds;

        try {
            /** @var ItemListService $itemListService */
            $itemListService = pluginApp(ItemListService::class);

            foreach (array_slice($orderedItemIds, 0, self::MAX_RECOMMENDATION_SOURCES) as $itemId) {
                $result = $itemListService->getItemList('cross_selling', $itemId, 'sorting.price.avg_asc', self::MAX_RECOMMENDATIONS, 'Accessory');

                foreach ($result['documents'] ?? [] as $document) {
                    $recommendedItemId = (int)($document['data']['item']['id'] ?? 0);
                    if ($recommendedItemId <= 0 || in_array($recommendedItemId, $seenItemIds, true)) {
                        continue;
                    }

                    $seenItemIds[] = $recommendedItemId;
                    $recommendations[] = $document;

                    if (count($recommendations) >= self::MAX_RECOMMENDATIONS) {
                        return $recommendations;
                    }
                }
            }
        } catch (\Throwable $exception) {
            // Empfehlungen sind Beiwerk: lieber ohne als mit kaputter Seite.
            $this->getLogger(__METHOD__)->warning(
                'CeresCoconutMTG: Cross-Selling fuer die Sendungsverfolgung nicht verfuegbar.',
                ['message' => $exception->getMessage()]
            );
        }

        return $recommendations;
    }

    /**
     * @param int $orderId
     * @return mixed|null Plenty Order-Modell
     */
    private function findOrder(int $orderId)
    {
        try {
            /** @var AuthHelper $authHelper */
            $authHelper = pluginApp(AuthHelper::class);
            /** @var OrderRepositoryContract $orderRepository */
            $orderRepository = pluginApp(OrderRepositoryContract::class);

            $order = $authHelper->processUnguarded(function () use ($orderRepository, $orderId) {
                return $orderRepository->findOrderById($orderId);
            });
        } catch (\Throwable $exception) {
            // Unbekannte Bestellnummer wirft eine Exception.
            return null;
        }

        if ($order === null || (int)$order->typeId !== self::ORDER_TYPE_SALES) {
            return null;
        }

        // Nur Bestellungen des eigenen Shops: Montagestore-Bestellungen nicht auf
        // mein-tuergriff.de anzeigen und umgekehrt.
        /** @var Application $application */
        $application = pluginApp(Application::class);
        if ((int)$order->plentyId !== (int)$application->getPlentyId()) {
            return null;
        }

        return $order;
    }

    /**
     * Die PLZ der Liefer- oder der Rechnungsadresse muss passen. Beide kennt der Kunde.
     *
     * @param mixed $order
     * @param string $zip
     * @return bool
     */
    private function orderMatchesZip($order, string $zip): bool
    {
        foreach ([self::ADDRESS_TYPE_DELIVERY, self::ADDRESS_TYPE_BILLING] as $addressType) {
            $address = $this->getAddress($order, $addressType);
            if ($address !== null && $this->normalizeZip((string)$address->postalCode) === $zip) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param mixed $order
     * @param int $addressType
     * @return mixed|null
     */
    private function getAddress($order, int $addressType)
    {
        $address = $addressType === self::ADDRESS_TYPE_DELIVERY ? $order->deliveryAddress : $order->billingAddress;
        if ($address !== null) {
            return $address;
        }

        foreach ($this->toIterable($order->addresses) as $orderAddress) {
            $pivot = $orderAddress->pivot;
            if ($pivot !== null && (int)$pivot->typeId === $addressType) {
                return $orderAddress;
            }
        }

        return null;
    }

    /**
     * @param mixed $order
     * @return array
     */
    private function buildOrder($order): array
    {
        $orderId = (int)$order->id;
        $deliveryAddress = $this->getAddress($order, self::ADDRESS_TYPE_DELIVERY);
        $zip = $deliveryAddress !== null ? trim((string)$deliveryAddress->postalCode) : '';

        $items = [];
        $variationIds = [];
        foreach ($this->toIterable($order->orderItems) as $orderItem) {
            if (!in_array((int)$orderItem->typeId, self::ORDER_ITEM_TYPES_SHOWN, true)) {
                continue;
            }

            $variationId = (int)$orderItem->itemVariationId;
            $items[] = [
                'name' => (string)$orderItem->orderItemName,
                'quantity' => (float)$orderItem->quantity,
                'variationId' => $variationId,
                'itemId' => 0
            ];
            $variationIds[] = $variationId;
        }

        $itemIds = $this->getItemIds($variationIds);
        foreach ($items as $index => $item) {
            $items[$index]['itemId'] = $itemIds[$item['variationId']] ?? 0;
        }

        $packages = [];
        $carrierFromProfile = $this->getCarrierFromShippingProfile($order);
        foreach ($this->getPackageNumbers($orderId) as $number) {
            $carrier = $this->detectCarrier($number, $carrierFromProfile);
            $packages[] = $this->normalizer->addLabels($this->trackPackage($carrier, $number, $zip));
        }

        return [
            'id' => $orderId,
            'date' => $this->formatDate($order->createdAt),
            'zip' => $zip,
            'town' => $deliveryAddress !== null ? trim((string)$deliveryAddress->town) : '',
            'status' => $this->getOrderStatus((float)$order->statusId),
            'stage' => $this->getOrderStage((float)$order->statusId, $packages),
            'items' => $items,
            'itemIds' => array_values(array_unique(array_filter(array_values($itemIds)))),
            'packages' => $packages
        ];
    }

    /**
     * Status vor dem Versand bzw. wenn es keine Paketnummer gibt.
     *
     * @param float $statusId
     * @return string
     */
    private function getOrderStatus(float $statusId): string
    {
        if ($statusId >= 8 && $statusId < 9) {
            return 'canceled';
        }
        if ($statusId >= 9) {
            return 'other';
        }
        if ($statusId >= 7) {
            return 'shipped';
        }
        if ($statusId >= 4) {
            return 'processing';
        }
        if ($statusId >= 3) {
            return 'payment';
        }

        return 'received';
    }

    /**
     * Stufe fuer die Fortschrittsanzeige der ganzen Bestellung: die des langsamsten Pakets.
     *
     * @param float $statusId
     * @param array $packages
     * @return int
     */
    private function getOrderStage(float $statusId, array $packages): int
    {
        if (!count($packages)) {
            return $statusId >= 7 && $statusId < 8
                ? TrackingNormalizer::STAGE_PACKED
                : TrackingNormalizer::STAGE_ORDERED;
        }

        return (int)min(array_column($packages, 'stage'));
    }

    /**
     * Status eines Pakets, zwischengespeichert je Paketnummer.
     *
     * @param string $carrier
     * @param string $number
     * @param string $zip
     * @return array
     */
    private function trackPackage(string $carrier, string $number, string $zip): array
    {
        $cacheKey = self::CACHE_PREFIX . $carrier . '_' . $number;
        $cached = $this->cache->get($cacheKey);
        if (is_array($cached)) {
            return $cached;
        }

        if ($carrier === TrackingNormalizer::CARRIER_UPS) {
            $package = $this->trackUps($number);
        } elseif ($carrier === TrackingNormalizer::CARRIER_DHL) {
            $package = $this->trackDhl($number, $zip);
        } else {
            $package = $this->normalizer->emptyPackage($number, $carrier);
        }

        if ($package['error']) {
            $minutes = self::ERROR_CACHE_MINUTES;
        } elseif ($package['stage'] === TrackingNormalizer::STAGE_DELIVERED) {
            $minutes = self::DELIVERED_CACHE_MINUTES;
        } else {
            $minutes = $this->getCacheMinutes();
        }

        $this->cache->put($cacheKey, $package, $minutes);

        return $package;
    }

    /**
     * @param string $number
     * @return array
     */
    private function trackUps(string $number): array
    {
        $tokenKey = self::CACHE_PREFIX . 'upsToken';

        $result = $this->callLibrary('CeresCoconutMTG::ups_tracking', [
            'clientId' => trim((string)$this->config->get('CeresCoconutMTG.tracking.upsClientId')),
            'clientSecret' => trim((string)$this->config->get('CeresCoconutMTG.tracking.upsClientSecret')),
            'token' => (string)$this->cache->get($tokenKey, ''),
            'trackingNumber' => $number
        ]);

        // UPS-Token gilt 4 Stunden. Mit Puffer speichern, damit es nicht mitten in
        // einer Anfrage ablaeuft.
        if (!empty($result['newToken'])) {
            $minutes = max(1, (int)floor((int)($result['tokenExpiresIn'] ?? 0) / 60) - 10);
            $this->cache->put($tokenKey, (string)$result['newToken'], $minutes);
        }

        if (empty($result['ok'])) {
            $this->logCarrierError('UPS', $number, $result);
            return $this->normalizer->failedPackage($number, TrackingNormalizer::CARRIER_UPS);
        }

        return $this->normalizer->fromUps((array)($result['response'] ?? []), $number);
    }

    /**
     * @param string $number
     * @param string $zip
     * @return array
     */
    private function trackDhl(string $number, string $zip): array
    {
        $result = $this->callLibrary('CeresCoconutMTG::dhl_tracking', [
            'apiKey' => trim((string)$this->config->get('CeresCoconutMTG.tracking.dhlApiKey')),
            'trackingNumber' => $number,
            'postalCode' => $zip
        ]);

        if (empty($result['ok'])) {
            $this->logCarrierError('DHL', $number, $result);
            return $this->normalizer->failedPackage($number, TrackingNormalizer::CARRIER_DHL);
        }

        return $this->normalizer->fromDhl((array)($result['response'] ?? []), $number);
    }

    /**
     * @param string $libCall
     * @param array $params
     * @return array
     */
    private function callLibrary(string $libCall, array $params): array
    {
        try {
            /** @var LibraryCallContract $libraryCall */
            $libraryCall = pluginApp(LibraryCallContract::class);
            $result = $libraryCall->call($libCall, $params);
        } catch (\Throwable $exception) {
            return ['ok' => false, 'error' => $exception->getMessage()];
        }

        return is_array($result) ? $result : ['ok' => false, 'error' => 'invalidLibraryResult'];
    }

    /**
     * @param string $carrierName
     * @param string $number
     * @param array $result
     */
    private function logCarrierError(string $carrierName, string $number, array $result)
    {
        $this->getLogger(__METHOD__)->error(
            'CeresCoconutMTG: Sendungsstatus bei ' . $carrierName . ' nicht abrufbar.',
            ['trackingNumber' => $number, 'error' => (string)($result['error'] ?? ($result['error_msg'] ?? ''))]
        );
    }

    /**
     * Paketdienst an der Paketnummer erkennen, sonst am Versandprofil der Bestellung.
     *
     * @param string $number
     * @param string $carrierFromProfile
     * @return string
     */
    private function detectCarrier(string $number, string $carrierFromProfile): string
    {
        if (preg_match('/^1Z[0-9A-Z]{16}$/i', $number)) {
            return TrackingNormalizer::CARRIER_UPS;
        }

        // DHL-Paketnummern: 12 oder 20 Ziffern (00340434...), Retouren/Ausland mit JJD/JVGL.
        if (preg_match('/^(\d{12}|\d{20}|JJD\d+|JVGL\d+)$/i', $number)) {
            return TrackingNormalizer::CARRIER_DHL;
        }

        return $carrierFromProfile;
    }

    /**
     * @param mixed $order
     * @return string
     */
    private function getCarrierFromShippingProfile($order): string
    {
        $profileId = 0;
        foreach ($this->toIterable($order->properties) as $property) {
            if ((int)$property->typeId === self::ORDER_PROPERTY_SHIPPING_PROFILE) {
                $profileId = (int)$property->value;
            }
        }

        if ($profileId <= 0) {
            return TrackingNormalizer::CARRIER_UNKNOWN;
        }

        try {
            /** @var AuthHelper $authHelper */
            $authHelper = pluginApp(AuthHelper::class);
            /** @var ParcelServicePresetRepositoryContract $presetRepository */
            $presetRepository = pluginApp(ParcelServicePresetRepositoryContract::class);

            $preset = $authHelper->processUnguarded(function () use ($presetRepository, $profileId) {
                return $presetRepository->getPresetById($profileId);
            });
        } catch (\Throwable $exception) {
            return TrackingNormalizer::CARRIER_UNKNOWN;
        }

        $name = $preset !== null ? strtoupper((string)$preset->backendName) : '';
        if (strpos($name, 'UPS') !== false) {
            return TrackingNormalizer::CARRIER_UPS;
        }
        if (strpos($name, 'DHL') !== false) {
            return TrackingNormalizer::CARRIER_DHL;
        }

        return TrackingNormalizer::CARRIER_UNKNOWN;
    }

    /**
     * @param int $orderId
     * @return string[]
     */
    private function getPackageNumbers(int $orderId): array
    {
        try {
            /** @var AuthHelper $authHelper */
            $authHelper = pluginApp(AuthHelper::class);
            /** @var OrderRepositoryContract $orderRepository */
            $orderRepository = pluginApp(OrderRepositoryContract::class);

            $numbers = $authHelper->processUnguarded(function () use ($orderRepository, $orderId) {
                return $orderRepository->getPackageNumbers($orderId);
            });
        } catch (\Throwable $exception) {
            return [];
        }

        $packageNumbers = [];
        foreach ((array)$numbers as $number) {
            $number = strtoupper(preg_replace('/\s+/', '', (string)$number));
            if (strlen($number) && !in_array($number, $packageNumbers, true)) {
                $packageNumbers[] = $number;
            }
        }

        return $packageNumbers;
    }

    /**
     * @param int[] $variationIds
     * @return array variationId => itemId
     */
    private function getItemIds(array $variationIds): array
    {
        $itemIds = [];

        /** @var AuthHelper $authHelper */
        $authHelper = pluginApp(AuthHelper::class);
        /** @var VariationRepositoryContract $variationRepository */
        $variationRepository = pluginApp(VariationRepositoryContract::class);

        foreach (array_unique($variationIds) as $variationId) {
            if ($variationId <= 0) {
                continue;
            }

            try {
                $variation = $authHelper->processUnguarded(function () use ($variationRepository, $variationId) {
                    return $variationRepository->findById($variationId);
                });
                $itemIds[$variationId] = (int)$variation->itemId;
            } catch (\Throwable $exception) {
                // Geloeschte Variante: Artikel ohne Link anzeigen.
            }
        }

        return $itemIds;
    }

    /**
     * Relationen der Plenty-Modelle sind Collections, Arrays oder null. "??" ist auf
     * den magischen Properties der Modelle nicht verlaesslich, deshalb hier abfangen.
     *
     * @param mixed $value
     * @return array|\Traversable
     */
    private function toIterable($value)
    {
        if (is_array($value) || $value instanceof \Traversable) {
            return $value;
        }

        return [];
    }

    /**
     * @return int
     */
    private function getCacheMinutes(): int
    {
        $minutes = (int)$this->config->get('CeresCoconutMTG.tracking.cacheMinutes');

        return $minutes > 0 ? $minutes : self::DEFAULT_CACHE_MINUTES;
    }

    /**
     * "39 104" / "a-1010" -> "39104" / "A1010"
     *
     * @param string $zip
     * @return string
     */
    private function normalizeZip(string $zip): string
    {
        return strtoupper(preg_replace('/[^0-9A-Za-z]/', '', $zip));
    }

    /**
     * @param mixed $date Carbon oder String
     * @return string
     */
    private function formatDate($date): string
    {
        if ($date instanceof \DateTimeInterface) {
            return $date->format('d.m.Y');
        }

        $timestamp = strtotime((string)$date);

        return $timestamp !== false ? date('d.m.Y', $timestamp) : '';
    }
}
