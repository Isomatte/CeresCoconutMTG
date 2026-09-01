<?php

namespace CeresCoconutMTG\Providers;

use Plenty\Plugin\ServiceProvider;
use Plenty\Plugin\Events\Dispatcher;
use Plenty\Plugin\Templates\Twig;
use IO\Helper\TemplateContainer;
use IO\Helper\ResourceContainer;
use IO\Extensions\Functions\Partial;
use IO\Services\ItemSearch\Helper\ResultFieldTemplate;
use Plenty\Plugin\ConfigRepository;
use Plenty\Modules\Webshop\Template\Providers\TemplateServiceProvider;
use Plenty\Modules\ShopBuilder\Contracts\ContentWidgetRepositoryContract;
use CeresCoconutMTG\Widgets\CustomItemImageCarouselWidget;
use CeresCoconutMTG\Widgets\CancellationFormWidget;
use CeresCoconutMTG\Providers\CeresCoconutMTGRouteServiceProvider;


/**
 * Class CeresCoconutMTGServiceProvider
 * @package CeresCoconutMTG\Providers
 */
class CeresCoconutMTGServiceProvider extends ServiceProvider
{
    const PRIORITY = 0;

    public function register()
    {
        // Eigener Endpunkt fuer das Widerrufsformular (/rest/cerescoconutmtg/cancellation).
        $this->getApplication()->register(CeresCoconutMTGRouteServiceProvider::class);
    }




    public function boot(Twig $twig, Dispatcher $dispatcher, ConfigRepository $config, ContentWidgetRepositoryContract $widgetRepository)
    {
        $enabledOverrides = explode(", ", $config->get("CeresCoconutMTG.templates.override"));
		// $twig = new \Twig\Environment(...);
		// $twig->addExtension(new StringExtension());

        //Adding JS


		 $dispatcher->listen('IO.Resources.Import', function (ResourceContainer $container)
        {
            // The script is imported in the Footer.twig of Ceres
            $container->addScriptTemplate('CeresCoconutMTG::Jscript');
            $container->addStyleTemplate('CeresCoconutMTG::Stylesheet2');
             $container->addScriptTemplate('CeresCoconutMTG::ItemList.Components.CategoryItem');
        }, self::PRIORITY);


        // Override partials
        $dispatcher->listen('IO.init.templates', function (Partial $partial) use ($enabledOverrides)
        {
            $partial->set('head', 'Ceres::PageDesign.Partials.Head');
            $partial->set('header', 'Ceres::PageDesign.Partials.Header.Header');
            $partial->set('page-design', 'Ceres::PageDesign.PageDesign');
            $partial->set('footer', 'Ceres::PageDesign.Partials.Footer');

            if (in_array("head", $enabledOverrides) || in_array("all", $enabledOverrides))
            {
                $partial->set('head', 'CeresCoconutMTG::PageDesign.Partials.Head');
            }

            if (in_array("header", $enabledOverrides) || in_array("all", $enabledOverrides))
            {
                $partial->set('header', 'CeresCoconutMTG::PageDesign.Partials.Header.Header');
            }

            if (in_array("page_design", $enabledOverrides) || in_array("all", $enabledOverrides))
            {
                $partial->set('page-design', 'CeresCoconutMTG::PageDesign.PageDesign');
            }

            if (in_array("footer", $enabledOverrides) || in_array("all", $enabledOverrides))
            {
                $partial->set('footer', 'CeresCoconutMTG::PageDesign.Partials.Footer');
            }


        }, self::PRIORITY);

        // Override homepage
        if (in_array("homepage", $enabledOverrides) || in_array("all", $enabledOverrides))
        {

            $dispatcher->listen('IO.tpl.home', function (TemplateContainer $container)
            {
                $container->setTemplate('CeresCoconutMTG::Homepage.Homepage');
                return false;
            }, self::PRIORITY);
        }

        // Override template for content categories
        if (in_array("category_content", $enabledOverrides) || in_array("all", $enabledOverrides))
        {

            $dispatcher->listen('IO.tpl.category.content', function (TemplateContainer $container)
            {
                $container->setTemplate('CeresCoconutMTG::Category.Content.CategoryContent');
                return false;
            }, self::PRIORITY);
        }

        // Override category view
        if (in_array("category_view", $enabledOverrides) || in_array("all", $enabledOverrides))
        {

            $dispatcher->listen('IO.tpl.category.item', function (TemplateContainer $container)
            {
                $container->setTemplate('CeresCoconutMTG::Category.Item.CategoryItem');
                return false;
            }, self::PRIORITY);
        }

        // Override shopping cart
        if (in_array("basket", $enabledOverrides) || in_array("all", $enabledOverrides))
        {

            $dispatcher->listen('IO.tpl.basket', function (TemplateContainer $container)
            {
                $container->setTemplate('CeresCoconutMTG::Basket.Basket');
                return false;
            }, self::PRIORITY);
        }

        // Override checkout
        if (in_array("checkout", $enabledOverrides) || in_array("all", $enabledOverrides))
        {

            $dispatcher->listen('IO.tpl.checkout', function (TemplateContainer $container)
            {
                $container->setTemplate('CeresCoconutMTG::Checkout.CheckoutView');
                return false;
            }, self::PRIORITY);
        }

        // Override order confirmation page
        if (in_array("order_confirmation", $enabledOverrides) || in_array("all", $enabledOverrides))
        {

            $dispatcher->listen('IO.tpl.confirmation', function (TemplateContainer $container)
            {
                $container->setTemplate('CeresCoconutMTG::Checkout.OrderConfirmation');
                return false;
            }, self::PRIORITY);
        }

        // Override login page
        if (in_array("login", $enabledOverrides) || in_array("all", $enabledOverrides))
        {

            // $dispatcher->listen('IO.tpl.login', function (TemplateContainer $container)
            // {
            //     $container->setTemplate('CeresCoconutMTG::Customer.LoginView');
            //     return false;
            // }, self::PRIORITY);

              $dispatcher->listen("IO.Resources.Import", function(ResourceContainer $container){
                $container->addScriptTemplate('');
            },self::PRIORITY);
        }

        // Override register page
        if (in_array("register", $enabledOverrides) || in_array("all", $enabledOverrides))
        {

            $dispatcher->listen('IO.tpl.register', function (TemplateContainer $container)
            {
                $container->setTemplate('CeresCoconutMTG::Customer.Register');
                return false;
            }, self::PRIORITY);
        }

        // Override single item page
        if (in_array("item", $enabledOverrides) || in_array("all", $enabledOverrides))
        {

            $dispatcher->listen('IO.tpl.item', function (TemplateContainer $container)
            {
                $container->setTemplate('CeresCoconutMTG::Item.SingleItemWrapper');
                return false;
            }, self::PRIORITY);
        }

        // Override search view
        if (in_array("search", $enabledOverrides) || in_array("all", $enabledOverrides))
        {
            // $dispatcher->listen('IO.tpl.search', function (TemplateContainer $container)
            // {
            //     $container->setTemplate('CeresCoconutMTG::ItemList.ItemSearch');
            //     return false;
            // }, self::PRIORITY);
            $dispatcher->listen("IO.Resources.Import", function(ResourceContainer $container){
                $container->addScriptTemplate('CeresCoconutMTG::ItemList.ItemSearch');
            },self::PRIORITY);
        }


        // Override my account
        if (in_array("my_account", $enabledOverrides) || in_array("all", $enabledOverrides))
        {

            $dispatcher->listen('IO.tpl.my-account', function (TemplateContainer $container)
            {
                $container->setTemplate('CeresCoconutMTG::MyAccount.MyAccountView');
                return false;
            }, self::PRIORITY);
        }

        // Override wish list
        if (in_array("wish_list", $enabledOverrides) || in_array("all", $enabledOverrides))
        {
            // $dispatcher->listen('IO.tpl.wish-list', function (TemplateContainer $container)
            // {
            //     $container->setTemplate('CeresCoconutMTG::WishList.WishListView');
            //     return false;
            // }, self::PRIORITY);
            $dispatcher->listen("IO.Resources.Import", function(ResourceContainer $container){
                $container->addScriptTemplate('CeresCoconutMTG::WishList.Components.WishListItem');
            },self::PRIORITY);
        }

        // Override contact page
        if (in_array("contact", $enabledOverrides) || in_array("all", $enabledOverrides))
        {

            $dispatcher->listen('IO.tpl.contact', function (TemplateContainer $container)
            {
                $container->setTemplate('CeresCoconutMTG::Customer.Contact');
                return false;
            }, self::PRIORITY);
        }

        // Override order return view
        if (in_array("order_return", $enabledOverrides) || in_array("all", $enabledOverrides))
        {

            $dispatcher->listen('IO.tpl.order.return', function (TemplateContainer $container)
            {
                $container->setTemplate('CeresCoconutMTG::OrderReturn.OrderReturnView');
                return false;
            }, self::PRIORITY);
        }

        // Override order return confirmation
        if (in_array("order_return_confirmation", $enabledOverrides) || in_array("all", $enabledOverrides))
        {

            $dispatcher->listen('IO.tpl.order.return.confirmation', function (TemplateContainer $container)
            {
                $container->setTemplate('CeresCoconutMTG::OrderReturn.OrderReturnConfirmation');
                return false;
            }, self::PRIORITY);
        }

        // Override cancellation rights
        if (in_array("cancellation_rights", $enabledOverrides) || in_array("all", $enabledOverrides))
        {

            $dispatcher->listen('IO.tpl.cancellation-rights', function (TemplateContainer $container)
            {
                $container->setTemplate('CeresCoconutMTG::StaticPages.CancellationRights');
                return false;
            }, self::PRIORITY);
        }

        // Override cancellation form
        if (in_array("cancellation_form", $enabledOverrides) || in_array("all", $enabledOverrides))
        {

            $dispatcher->listen('IO.tpl.cancellation-form', function (TemplateContainer $container)
            {
                $container->setTemplate('CeresCoconutMTG::StaticPages.CancellationForm');
                return false;
            }, self::PRIORITY);
        }

        // Override legal disclosure
        if (in_array("legal_disclosure", $enabledOverrides) || in_array("all", $enabledOverrides))
        {

            $dispatcher->listen('IO.tpl.legal-disclosure', function (TemplateContainer $container)
            {
                $container->setTemplate('CeresCoconutMTG::StaticPages.LegalDisclosure');
                return false;
            }, self::PRIORITY);
        }

        // Override privacy policy
        if (in_array("privacy_policy", $enabledOverrides) || in_array("all", $enabledOverrides))
        {

            $dispatcher->listen('IO.tpl.privacy-policy', function (TemplateContainer $container)
            {
                $container->setTemplate('CeresCoconutMTG::StaticPages.PrivacyPolicy');
                return false;
            }, self::PRIORITY);
        }

        // Override terms and conditions
        if (in_array("terms_conditions", $enabledOverrides) || in_array("all", $enabledOverrides))
        {

            $dispatcher->listen('IO.tpl.terms-conditions', function (TemplateContainer $container)
            {
                $container->setTemplate('CeresCoconutMTG::StaticPages.TermsAndConditions');
                return false;
            }, self::PRIORITY);
        }

        // Override item not found page
        if (in_array("item_not_found", $enabledOverrides) || in_array("all", $enabledOverrides))
        {

            $dispatcher->listen('IO.tpl.item-not-found', function (TemplateContainer $container)
            {
                $container->setTemplate('CeresCoconutMTG::StaticPages.ItemNotFound');
                return false;
            }, self::PRIORITY);
        }

        // Override page not found page
        if (in_array("page_not_found", $enabledOverrides) || in_array("all", $enabledOverrides))
        {

            $dispatcher->listen('IO.tpl.page-not-found', function (TemplateContainer $container)
            {
                $container->setTemplate('CeresCoconutMTG::StaticPages.PageNotFound');
                return false;
            }, self::PRIORITY);
        }

        // Override newsletter opt-out page
        if (in_array("newsletter_opt_out", $enabledOverrides) || in_array("all", $enabledOverrides))
        {

            $dispatcher->listen('IO.tpl.newsletter.opt-out', function (TemplateContainer $container)
            {
                $container->setTemplate('CeresCoconutMTG::Newsletter.NewsletterOptOut');
                return false;
            }, self::PRIORITY);
        }

        $enabledResultFields = [];

        if(!empty($config->get("CeresCoconutMTG.result_fields.override")))
        {
            $enabledResultFields = explode(", ", $config->get("CeresCoconutMTG.result_fields.override"));
        }

        if(!empty($enabledResultFields))
        {
            $dispatcher->listen( 'IO.ResultFields.*', function(ResultFieldTemplate $templateContainer) use ($enabledResultFields)
            {
                $templatesToOverride = [];

                // Override list item result fields
                if (in_array("list_item", $enabledResultFields) || in_array("all", $enabledResultFields))
                {
                    $templatesToOverride[ResultFieldTemplate::TEMPLATE_LIST_ITEM] = 'CeresCoconutMTG::ResultFields.ListItem';
                }

                // Override single item view result fields
                if (in_array("single_item", $enabledResultFields) || in_array("all", $enabledResultFields))
                {
                    $templatesToOverride[ResultFieldTemplate::TEMPLATE_SINGLE_ITEM] = 'CeresCoconutMTG::ResultFields.SingleItem';
                }

                // Override basket item result fields
                if (in_array("basket_item", $enabledResultFields) || in_array("all", $enabledResultFields))
                {
                    $templatesToOverride[ResultFieldTemplate::TEMPLATE_BASKET_ITEM] = 'CeresCoconutMTG::ResultFields.BasketItem';
                }

                // Override auto complete list item result fields
                if (in_array("auto_complete_list_item", $enabledResultFields) || in_array("all", $enabledResultFields))
                {
                    $templatesToOverride[ResultFieldTemplate::TEMPLATE_AUTOCOMPLETE_ITEM_LIST] = 'CeresCoconutMTG::ResultFields.AutoCompleteListItem';
                }

                // Override category tree result fields
                if (in_array("category_tree", $enabledResultFields) || in_array("all", $enabledResultFields))
                {
                    $templatesToOverride[ResultFieldTemplate::TEMPLATE_CATEGORY_TREE] = 'CeresCoconutMTG::ResultFields.CategoryTree';
                }

                $templateContainer->setTemplates($templatesToOverride);
            }, self::PRIORITY);
        }
		$widgetRepository->registerWidget(CustomItemImageCarouselWidget::class);
        $widgetRepository->registerWidget(CancellationFormWidget::class);
    }
}
