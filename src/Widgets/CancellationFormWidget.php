<?php

namespace CeresCoconutMTG\Widgets;

use Plenty\Modules\ShopBuilder\Contracts\DynamicWidget;
use Plenty\Plugin\Templates\Twig;

/**
 * Class CancellationFormWidget
 *
 * ShopBuilder-Variante des Theme-Widerrufsformulars. Damit laesst sich das Formular in
 * eine bestehende Inhaltsseite legen, ohne die Route /widerrufsformular/ umzubauen.
 *
 * Empfaenger und Betreff kommen aus der Plugin-Konfiguration (Tab "Widerrufsformular")
 * und nicht aus Widget-Einstellungen - der Endpunkt darf sich den Empfaenger nicht vom
 * Client vorgeben lassen.
 *
 * @package CeresCoconutMTG\Widgets
 */
class CancellationFormWidget implements DynamicWidget
{
    /** @var Twig */
    private $twig;

    public function __construct(Twig $twig)
    {
        $this->twig = $twig;
    }

    public function getData(): array
    {
        return [
            'identifier' => 'cancellationForm',
            'label' => 'Widerrufsformular (Theme)',
            'categories' => ['form', 'contact']
        ];
    }

    public function getSettings(): array
    {
        return [];
    }

    public function getPreview($widgetSettings = [], $children = []): string
    {
        return $this->render($widgetSettings, $children);
    }

    public function render($widgetSettings = [], $children = []): string
    {
        return $this->twig->render('CeresCoconutMTG::Widgets.CancellationFormWidget');
    }
}
