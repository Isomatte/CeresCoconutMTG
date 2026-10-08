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
        $orderId = (int)$this->read($order, 'id');

        // Nur Bestellungen dieses Shops: Die Seite zeigt andere Mandanten nicht an.
        /** @var Application $application */
        $application = pluginApp(Application::class);
        if ($orderId <= 0
            || (int)$this->read($order, 'typeId') !== self::ORDER_TYPE_SALES
            || (int)$this->read($order, 'plentyId') !== (int)$application->getPlentyId()) {
            return '';
        }

        return $twig->render('CeresCoconutMTG::ShipmentTracking.Containers.OrderHistoryButton', [
            'trackingUrl' => '/sendungsverfolgung/?order=' . $orderId
        ]);
    }

    /**
     * Ceres uebergibt die Bestellung je nach Stelle als Modell oder als Array.
     *
     * @param mixed $order
     * @param string $key
     * @return mixed
     */
    private function read($order, string $key)
    {
        if (is_array($order)) {
            return $order[$key] ?? null;
        }

        return $order !== null ? $order->$key : null;
    }
}
