<?php

namespace CeresCoconutMTG\Controllers;

use CeresCoconutMTG\Services\ShipmentTrackingService;
use Plenty\Plugin\ConfigRepository;
use Plenty\Plugin\Controller;
use Plenty\Plugin\Http\Request;
use Plenty\Plugin\Http\Response;
use Plenty\Plugin\Templates\Twig;

/**
 * Class ShipmentTrackingController
 *
 * Sendungsverfolgungsseite /sendungsverfolgung.
 *
 * GET ohne Parameter zeigt das Suchformular. Bestellnummer und PLZ kommen per POST aus
 * dem Formular. Der persoenliche Link aus Bestell- und Versandbestaetigung enthaelt
 * statt der PLZ den Zugangsschluessel der Bestellung (?order=...&key=...), damit keine
 * Adressdaten in der URL stehen. ?order=...&zip=... funktioniert ebenfalls.
 *
 * @package CeresCoconutMTG\Controllers
 */
class ShipmentTrackingController extends Controller
{
    const TEMPLATE = 'CeresCoconutMTG::ShipmentTracking.ShipmentTracking';

    /** Maximale Laenge der Eingaben, alles darueber ist kein echter Wert. */
    const MAX_INPUT_LENGTH = 64;

    /** @var Request */
    private $request;

    /** @var Response */
    private $response;

    /** @var ConfigRepository */
    private $config;

    public function __construct(Request $request, Response $response, ConfigRepository $config)
    {
        $this->request = $request;
        $this->response = $response;
        $this->config = $config;
    }

    /**
     * @param Twig $twig
     * @param ShipmentTrackingService $trackingService
     * @return Response
     */
    public function show(Twig $twig, ShipmentTrackingService $trackingService): Response
    {
        $orderInput = $this->readInput('order');
        $zipInput = $this->readInput('zip');
        $accessKeyInput = $this->readInput('key');

        $tracking = [
            'result' => 'form',
            'orderInput' => $orderInput,
            'order' => null,
            'recommendations' => [],
            'helpUrl' => trim((string)$this->config->get('CeresCoconutMTG.tracking.helpUrl'))
        ];

        if (!$this->isEnabled()) {
            $tracking['result'] = 'disabled';
            return $this->render($twig, $tracking, 404);
        }

        if (strlen($orderInput) || strlen($zipInput) || strlen($accessKeyInput)) {
            $lookup = $trackingService->lookup($orderInput, $zipInput, $accessKeyInput);
            $tracking['result'] = $lookup['result'];

            if ($lookup['result'] === ShipmentTrackingService::RESULT_FOUND) {
                $tracking['order'] = $lookup['order'];
                $tracking['recommendations'] = $trackingService->getRecommendations($lookup['order']);
            }
        }

        return $this->render($twig, $tracking);
    }

    /**
     * @param Twig $twig
     * @param array $tracking
     * @param int $status
     * @return Response
     */
    private function render(Twig $twig, array $tracking, int $status = 200): Response
    {
        // assetName und bodyClasses setzt Ceres nur bei seinen eigenen Seiten. Ohne
        // assetName faellt Ceres auf das Checkout-Paket zurueck und Stylesheet2.twig
        // laedt main.min.css nicht (Fonts, Header und Footer des Themes fehlen dann).
        // Werte wie bei den Inhaltsseiten (Impressum, Widerrufsformular).
        $templateData = [
            'tracking' => $tracking,
            'assetName' => 'ceres-base',
            'bodyClasses' => ['page-category-content', 'page-category', 'page-shipment-tracking']
        ];

        // Die Seite enthaelt Bestelldaten: nicht im Seiten-Cache oder bei Proxys ablegen
        // und nicht indexieren.
        return $this->response->make(
            $twig->render(self::TEMPLATE, $templateData),
            $status,
            [
                'Cache-Control' => 'no-store, private',
                'X-Robots-Tag' => 'noindex, nofollow',
                'Content-Type' => 'text/html; charset=utf-8'
            ]
        );
    }

    /**
     * @param string $key
     * @return string
     */
    private function readInput(string $key): string
    {
        $value = $this->request->get($key, '');

        if (!is_string($value)) {
            return '';
        }

        return mb_substr(trim($value), 0, self::MAX_INPUT_LENGTH, 'UTF-8');
    }

    /**
     * Die Plugin-Konfiguration liefert je nach Feldtyp bool oder String zurueck.
     *
     * @return bool
     */
    private function isEnabled(): bool
    {
        $value = $this->config->get('CeresCoconutMTG.tracking.enabled');

        return $value === true || $value === 'true' || $value === 1 || $value === '1';
    }
}
