<?php

namespace CeresCoconutMTG\Containers;

use Plenty\Plugin\Application;
use Plenty\Plugin\ConfigRepository;
use Plenty\Plugin\Templates\Twig;

/**
 * Class ShipmentTrackingOrderHistoryContainer
 *
 * Button "Sendung verfolgen" je Bestellung in der Auftragshistorie im Kundenkonto.
 * Wird mit dem Container "Ceres::MyAccount.OrderHistoryPaymentInformation" verknuepft,
 * den Ceres (MyAccount/Components/OrderHistory.twig) je Bestellung mit entry.order
 * aufruft. Der Link enthaelt nur die Bestellnummer, die Seite erkennt den
 * eingeloggten Kunden (ShipmentTrackingService::lookupForLoggedInCustomer).
 *
 * @package CeresCoconutMTG\Containers
 */
class ShipmentTrackingOrderHistoryContainer
{
    const ORDER_TYPE_SALES = 1;

    /**
     * @param Twig $twig
     * @param array $arg [0] = Bestellung (Modell oder Array)
     * @return string
     */
    public function call(Twig $twig, $arg): string
    {
        /** @var ConfigRepository $config */
        $config = pluginApp(ConfigRepository::class);
        $enabled = $config->get('CeresCoconutMTG.tracking.enabled');
        if (!($enabled === true || $enabled === 'true' || $enabled === 1 || $enabled === '1')) {
            return '';
        }

        $order = is_array($arg) && isset($arg[0]) ? $arg[0] : null;

        // Ceres uebergibt die Bestellung je nach Stelle als Modell oder als Array.
        // Felder einzeln lesen: dynamische Property-Namen sind im
        // Plugin-Code nicht erlaubt.
        $orderId = 0;
        $typeId = 0;
        $plentyId = 0;
        if (is_array($order)) {
            $orderId = (int)($order['id'] ?? 0);
            $typeId = (int)($order['typeId'] ?? 0);
            $plentyId = (int)($order['plentyId'] ?? 0);
        } elseif ($order !== null) {
            $orderId = (int)$order->id;
            $typeId = (int)$order->typeId;
            $plentyId = (int)$order->plentyId;
        }

        // Nur Bestellungen dieses Shops: Die Seite zeigt andere Mandanten nicht an.
        /** @var Application $application */
        $application = pluginApp(Application::class);
        if ($orderId <= 0
            || $typeId !== self::ORDER_TYPE_SALES
            || $plentyId !== (int)$application->getPlentyId()) {
            return '';
        }

        return $twig->render('CeresCoconutMTG::ShipmentTracking.Containers.OrderHistoryButton', [
            'trackingUrl' => '/sendungsverfolgung/?order=' . $orderId
        ]);
    }
}
