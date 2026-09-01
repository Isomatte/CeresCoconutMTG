<?php
namespace CeresCoconutMTG\Widgets;

// Hier laden wir den offiziellen Widget-Vertrag von Plentymarkets
use Plenty\Modules\ShopBuilder\Contracts\DynamicWidget;
use Plenty\Plugin\Templates\Twig;

// Durch "implements DynamicWidget" erkennt Plentymarkets die Klasse jetzt als Widget
class CustomItemImageCarouselWidget implements DynamicWidget
{
    private $twig;

    public function __construct(Twig $twig)
    {
        $this->twig = $twig;
    }

    // 1. Definition & Ort des Widgets laut Dokumentation
    public function getData(): array
    {
        return [
            // Der Identifier muss den Plugin-Namespace enthalten, sonst taucht das
            // Widget nicht in der ShopBuilder-Liste auf. Deshalb wurde das Karussell
            // bisher per Markup <custom-item-image-carousel> eingebunden.
            'identifier' => 'CeresCoconutMTG::CustomItemImageCarouselWidget',
            'label'      => 'Custom 360° Bilderkarussell',
            'type'       => 'default',
            'categories' => ['item'],
            'position'   => 100
        ];
    }

    // 2. Einstellungen des Widgets
    public function getSettings(): array
    {
        return [];
    }

    // 3. Ansicht im ShopBuilder
    public function getPreview($widgetSettings = [], $children = []): string
    {
        return $this->twig->render('CeresCoconutMTG::Widgets.CustomItemImageCarouselWidget');
    }

    // 4. Ansicht live im Shop
    public function render($widgetSettings = [], $children = []): string
    {
        return $this->twig->render('CeresCoconutMTG::Widgets.CustomItemImageCarouselWidget');
    }
}