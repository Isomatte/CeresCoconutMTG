<?php

namespace CeresCoconutMTG\Containers;

use Plenty\Plugin\Application;
use Plenty\Plugin\ConfigRepository;
use Plenty\Plugin\Http\Request;
use Plenty\Plugin\Templates\Twig;

/**
 * Class ShipmentTrackingOrderHistoryContainer
 *
 * Button "Sendung verfolgen" zu einer Bestellung. Verknuepfen mit
 * - "Ceres::MyAccount.OrderHistoryPaymentInformation": je Bestellung in der
 *   Auftragshistorie im Kundenkonto (Ceres ruft ihn mit entry.order auf),
 * - "Ceres::OrderConfirmation.AdditionalPaymentInformation": in den Bestelldetails
 *   (Popup im Kundenkonto und Bestellbestaetigung; auch ConversionCheckout ruft ihn auf).
 *
 * Eingeloggte Kunden erkennt die Seite selbst (lookupForLoggedInCustomer). Auf der
 * Bestellbestaetigung von Gaesten steht der Zugangsschluessel in der URL
 * (?orderId=...&accessKey=...) und wird mitgegeben.
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

        $trackingUrl = '/sendungsverfolgung/?order=' . $orderId;

        /** @var Request $request */
        $request = pluginApp(Request::class);
        $accessKey = $request->get('accessKey', '');
        if ((int)$request->get('orderId', 0) === $orderId
            && is_string($accessKey)
            && preg_match('/^[A-Za-z0-9]{4,64}$/', $accessKey)) {
            $trackingUrl .= '&key=' . $accessKey;
        }

        return $twig->render('CeresCoconutMTG::ShipmentTracking.Containers.OrderHistoryButton', [
            'trackingUrl' => $trackingUrl
        ]);
    }
}
