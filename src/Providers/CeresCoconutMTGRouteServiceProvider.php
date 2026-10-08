<?php

namespace CeresCoconutMTG\Providers;

use Plenty\Plugin\RouteServiceProvider;
use Plenty\Plugin\Routing\ApiRouter;
use Plenty\Plugin\Routing\Router;

/**
 * Class CeresCoconutMTGRouteServiceProvider
 *
 * Registriert die Sendungsverfolgungsseite und den eigenen Endpunkt fuer das
 * Widerrufsformular des Themes.
 *
 * Hintergrund: Das Ceres-Widget "E-Mail-Formular" postet beim Formulartyp
 * "Formular zum Vertragswiderruf" auf /rest/io/cancellation. Dieser Core-Endpunkt
 * nimmt replyTo[mail] zwar entgegen, setzt daraus aber keinen Reply-To-Header.
 * Eine Antwort auf die Widerrufsmail geht deshalb an den Shop selbst zurueck.
 * Der Endpunkt hier verschickt die Mail selbst und setzt Reply-To korrekt.
 *
 * @package CeresCoconutMTG\Providers
 */
class CeresCoconutMTGRouteServiceProvider extends RouteServiceProvider
{
    public function register()
    {
    }

    /**
     * @param Router $router
     * @param ApiRouter $api
     */
    public function map(Router $router, ApiRouter $api)
    {
        // Sendungsverfolgung: Formular (GET), Suche aus dem Formular (POST) und Link aus
        // der Versandbestaetigung (GET mit order + zip).
        $router->get('sendungsverfolgung', 'CeresCoconutMTG\Controllers\ShipmentTrackingController@show');
        $router->post('sendungsverfolgung', 'CeresCoconutMTG\Controllers\ShipmentTrackingController@show');

        $api->version(
            ['v1'],
            ['namespace' => 'CeresCoconutMTG\Controllers'],
            function (ApiRouter $api) {
                $api->post('cerescoconutmtg/cancellation', 'CancellationFormController@send');
            }
        );
    }
}
