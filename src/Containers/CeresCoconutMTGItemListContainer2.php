<?php

namespace CeresCoconutMTG\Containers;

use Plenty\Plugin\Templates\Twig;

class CeresCoconutMTGItemListContainer2
{
    public function call(Twig $twig, $arg):string
    {
        return $twig->render('CeresCoconutMTG::Containers.ItemLists.ItemList2', ["item" => $arg[0]]);
    }
}