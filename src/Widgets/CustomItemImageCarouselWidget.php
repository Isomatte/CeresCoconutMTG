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
            'identifier' => 'customItemImageCarousel',
            'label'      => 'Custom 360° Bilderkarussell',
            'categories' => ['item'] 
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