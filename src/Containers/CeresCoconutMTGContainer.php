<?php

namespace CeresCoconutMTG\Containers;

use Plenty\Plugin\Templates\Twig;

class CeresCoconutMTGContainer
{
    public function call(Twig $twig):string
    {
        return $twig->render('CeresCoconutMTG::Stylesheet');
    }
}