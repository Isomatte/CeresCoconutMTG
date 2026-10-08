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
 * GET ohne Parameter zeigt das Suchformular. Bestellnummer und PLZ kommen entweder per
 * POST aus dem Formular oder per GET aus dem Link in der Versandbestaetigung
 * (?order=...&zip=...).
 *
 * @package CeresCoconutMTG\Controllers
 */
class ShipmentTrackingController extends Controller
{
    const TEMPLATE = 'CeresCoconutMTG::ShipmentTracking.ShipmentTracking';

    /** Maximale Laenge der Eingaben, alles darueber ist kein echter Wert. */
    const MAX_INPUT_LENGTH = 30;

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

        if (strlen($orderInput) || strlen($zipInput)) {
            $lookup = $trackingService->lookup($orderInput, $zipInput);
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
        // Die Seite enthaelt Bestelldaten: nicht im Seiten-Cache oder bei Proxys ablegen
        // und nicht indexieren.
        return $this->response->make(
            $twig->render(self::TEMPLATE, ['tracking' => $tracking]),
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
