<?php

namespace CeresCoconutMTG\Containers;

use Plenty\Plugin\Templates\Twig;

class CeresCoconutMTGItemListContainer1
{
    public function call(Twig $twig, $arg):string
    {
        return $twig->render('CeresCoconutMTG::Containers.ItemLists.ItemList1', ["item" => $arg[0]]);
    }
}