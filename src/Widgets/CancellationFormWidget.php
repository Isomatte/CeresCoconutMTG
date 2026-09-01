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
            // Der Identifier MUSS den Plugin-Namespace enthalten. Ohne Praefix ordnet der
            // ShopBuilder das Widget keinem Plugin zu und bietet es gar nicht erst an.
            'identifier' => 'CeresCoconutMTG::CancellationFormWidget',
            'label' => 'Widerrufsformular (Theme)',

            // Ohne 'type' taucht das Widget in der ShopBuilder-Liste nicht auf: die
            // Container einer Inhaltsseite erlauben bestimmte Widget-Typen, und ein
            // Widget ohne Typ passt zu keinem davon.
            // Entspricht Ceres\Widgets\Helper\WidgetTypes::DEFAULT.
            'type' => 'default',

            // Entspricht Ceres\Widgets\Helper\WidgetCategories::FORM bzw. CONTACT.
            'categories' => ['form', 'contact'],
            'position' => 100,
            'keywords' => ['widerruf', 'widerrufsformular', 'cancellation', 'formular', 'form']
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
