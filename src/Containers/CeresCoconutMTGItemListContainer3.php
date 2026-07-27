<?php

namespace CeresCoconutMTG\Containers;

use Plenty\Plugin\Templates\Twig;

class CeresCoconutMTGItemListContainer3
{
    public function call(Twig $twig, $arg):string
    {
        return $twig->render('CeresCoconutMTG::Containers.ItemLists.ItemList3', ["item" => $arg[0]]);
    }
}