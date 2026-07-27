$(window).scroll(function(){
    var scroll = $(window).scrollTop();
    if (scroll >= 20) {
        $("body").addClass("scrolling");
    }else{
        $("body").removeClass("scrolling");
    }
});



$(document).ready(function(){


    // Filter Function mobile

    window.onload = function() {
        $(".filter-wrapper .card .h3").click(function(e){
            $(this).toggleClass('collapsed');
            $(this).parent().toggleClass("nactive");
        });
    };


    // Brand Slider on homepage
    setTimeout(function(){
        $('.brand-slider').each(function(){
            $(this).append("<div class='owl-carousel'></div>");
            var owlCarousel = $(this).find(".owl-carousel");
            owlCarousel.append($(this).find(".carousel-item").detach());
            owlCarousel.owlCarousel({
                center: true,
                items:5,
                loop:true,
                autoWidth: true,
                navText:[],
                margin:60
            });
        });
    },500)




    $('.filter-toggler').click(function(){
        if($(this).hasClass('closed')){
            $(this).removeClass('closed');
            $(this).addClass('opened');
            $('.filter-panel').addClass('show-filters');
            $('.filter-overlay').css('display','block');
            $('.filter-toggle-wrapper').addClass('filter-opened');
        }else{
            $(this).removeClass('opened');
            $(this).addClass('closed');
            $('.filter-panel').removeClass('show-filters');
            $('.filter-overlay').css('display','none');
            $('.filter-toggle-wrapper').removeClass('filter-opened');
        }
    });
    $('.close-filters').click(function(){
        $('.filter-panel').removeClass('show-filters');
        $('.filter-toggler').removeClass('opened');
        $('.filter-toggler').addClass('closed');
        $('.filter-overlay').css('display','none');
        $('.filter-toggle-wrapper').removeClass('filter-opened');
    })
    $('.toggle-additional-filters').click(function(){
        if($(this).hasClass('closed')){
            $(this).removeClass('closed');
            $(this).addClass('opened');
            $('.filter-panel').addClass('show-additional-filters');
            $('.toggle-additional-filters .toggle-additional-filters').html('Weniger Filter');
        }else{
            $(this).removeClass('opened');
            $(this).addClass('closed');
            $('.filter-panel').removeClass('show-additional-filters');
            $('.toggle-additional-filters .toggle-additional-filters').html('Mehr Filter');
        }
    })

    $('.navbar-toggler').click(checkforSale);
    $('li.ddown').click(checkforSale);


    $('.cmp-address-list .dropdown-toggle.card').click(function(){
        setTimeout(function() {
            if($('body .dropdown.items').hasClass('show')){
                if($('body').find('.modal-backdrop.fade.show.custom').length == 0){
                    $('body').append('<div class="modal-backdrop fade show custom"></div>');
                    $('body').find('.modal-backdrop.fade.show.custom').css('z-index','0');
                    $(this).parents('.col-md-6.bg-white').addClass('active');
                }
            }else{
                $('body').find('.modal-backdrop.fade.show.custom').remove();
                $(this).parents('.col-md-6.bg-white').removeClass('active');
            }
        }, 150);
    });
    $('.cmp-address-list .dropdown.items button').click(function(){
        $('body').find('.modal-backdrop.fade.show.custom').remove();
        $(this).parents('.col-md-6.bg-white').removeClass('active');
    });
    setInterval(function(){
        if(!$('body .dropdown.items').hasClass('show')){
            $('body').find('.modal-backdrop.fade.show.custom').remove();
        }
    }, 500);

    $('.go-to-sale-overlay').click(function(){
        window.location.href = '/sale/';
    })
});


function checkforSale(){
    setTimeout(function(){
        $('.mobile-navigation .menu-active li').each(function(){
            let li = $(this);
            if(li.find('a').attr('href') == '/sale/'){
                li.append('<div class="row-full"></div>');
                li.addClass('sale');
            }
        });
    },500);
}


window.onload = function () {

    checkmarquee();


    if($('body').find('.stage-carousel').length > 0){
        $('.stage-carousel .carousel-item').each(function(){
            let link = $(this).find('a').attr('href');
            let content = $(this).find('.widget-caption').text();
            if(content.indexOf('<topline>') > -1){
                var topline = content.split('<topline>')[1].split('</topline>')[0];
                // var button = content.split('<button>')[1].split('</button>')[0];
            }
            if(content.indexOf('<headline>') > -1){
                var headline = content.split('<headline>')[1].split('</headline>')[0];
            }
            if(content.indexOf('<coupon>') > -1){
                var coupon = content.split('<coupon>')[1].split('</coupon>')[0];
            }
            $(this).find('.widget-caption').append('<div class="text-link-banner"><h4 class="pre-headline">'+topline+'</h4><h1>'+headline+'</h1></div><h4 class="pre-headline coupon">'+coupon+'</h4>');
            $(this).find('.widget-caption h2').remove();
        });
        setTimeout(function() {
            $('.stage-carousel').find('.widget-caption').css('opacity','1');
        }, 500);
    }

    if (!$('body').hasClass('optim-checkout')) {
        if ($('body').find('.input-unit').length > 0) {
            $('.input-unit').each(function () {
                if ($(this).find('label').length > 0) {
                    let label = $(this).find('label').text();
                    if (label.includes('Mail')) {
                        $(this).find('input').attr('placeholder', 'Ihre E-Mail Adresse');
                    } else if (label.includes('Passwort')) {
                        $(this).find('input').attr('placeholder', 'Ihr Passwort');
                    } else {
                        $(this).find('input').attr('placeholder', label.replace('*', ''));
                        $(this).find('textarea').attr('placeholder', label.replace('*', ''));
                    }
                }
            });
        }
    }

    if($('body').find('.category-boxes-wrapper').length > 0){
        $('.category-boxes-wrapper').append('<div class="row-bg"></div>');
    }
    if($('body').find('.about-us-wrapper').length > 0){
        $('.about-us-wrapper').append('<div class="row-bg"></div>');
    }
    if(window.location.href.includes('/lexikon/')){
        $('body').addClass('lexikon');
    }

    if($('body').find('#shop-builder-preview-frame').length == 0){
        let pre_top = $('.pre-top-bar').html();
        $('#page-header-parent .test2').append('<div class="pre-top"><div class="row-full"></div>'+pre_top+'</div>');
        $('.pre-top-bar').remove();
    }
    if($('body').hasClass('page-checkout')){
        let label = $('.textarea.cmp-contact label');
        $('.textarea.cmp-contact').find('textarea').attr('placeholder',label.text());
        label.remove();
    }


    if($('body').find('.filter-toggler').length > 0){
        $('.filter-toggler').addClass('closed');
        $('.toggle-additional-filters').addClass('closed');
        if($('.filter-panel').height() < 400){
            $('.filter-panel > div:nth-of-type(2) > div').remove();
        }
        $('#page-body').append('<div class="filter-overlay"></div>');
    }

    if($('body').find('.all-category-overview').length > 0){
        $('.all-category-overview > div > ul').each(function(){
            $(this).find('.expand-nav').trigger('click');
            if($(this).find('li a').attr('href') == '/sale/'){
                $(this).remove();
            }
        })
    }

    // if($('body').find('.homepage-sale-mobileslider').length > 0){
    //     initializeOwlCarousel($('.homepage-sale-mobileslider .owl-carousel'),false,20,true,[],1,false,{768:{items:2},992:{items:3}})
    //     if(window.innerWidth>=1200){
    //         $('.homepage-sale.overlay').removeClass('visually-hidden');
    //         $('.homepage-sale.bottom').removeClass('visually-hidden');
    //         $('.homepage-sale-mobileslider').addClass('visually-hidden');
    //     }else{
    //         $('.homepage-sale.overlay').addClass('visually-hidden');
    //         $('.homepage-sale.bottom').addClass('visually-hidden');
    //         $('.homepage-sale-mobileslider').removeClass('visually-hidden');
    //     }
    // }

    if($('body').find('.category-boxes-wrapper').length > 0){

        setTimeout(function(){
            $('.category-boxes-wrapper .widget-four-col:first-of-type').find(".widget-inner.col-12.col-md-3.widget-prop-md-1-1:last-of-type").remove();
            $('.category-boxes-wrapper .widget-four-col:nth-of-type(2)').find(".widget-inner.col-12.col-md-3.widget-prop-md-1-1:last-of-type").remove();
            let articles = $('.category-boxes-wrapper .widget-four-col:first-of-type').find(".widget-inner.col-12.col-md-3.widget-prop-md-1-1").clone();
            $(articles).each(function(){
                $(this).removeClass();
            })
            let articles2 = $('.category-boxes-wrapper .widget-four-col:nth-of-type(2)').find(".widget-inner.col-12.col-md-3.widget-prop-md-1-1").clone();
            $(articles2).each(function(){
                $(this).removeClass();
            })
            $('.category-boxes-mobile').append('<div class="owl-carousel sale"></div>');
            let owlCarousel = $('.category-boxes-mobile').find('.owl-carousel');
            owlCarousel.append(articles);
            owlCarousel.append(articles2);
            owlCarousel.owlCarousel({
                items:1,
                loop:false,
                navText:[],
                margin:20,
                responsive:{
                    768:{
                        items:2
                    },
                    992:{
                        items:3
                    }
                }
            })
        },500);

        if(window.innerWidth >= 992){
            $('.category-boxes-wrapper .widget-inner:nth-of-type(2)').removeClass('visually-hidden');
            $('.category-boxes-mobile').addClass('visually-hidden');
        }else{
            $('.category-boxes-wrapper .widget-inner:nth-of-type(2)').addClass('visually-hidden');
            $('.category-boxes-mobile').removeClass('visually-hidden');
        }
    }


    if($('body').hasClass('page-category')){
        $('.availability-filter').appendTo('.widget-filter-attributes-properties-characteristics');
    }


    $('.review-slider > .widget-inner:first-of-type > div').addClass('owl-carousel');
    initializeOwlCarousel($('.review-slider > .widget-inner:first-of-type > div.owl-carousel'),false,20,true,[],1,false,{768:{items:2},992:{items:3}})




}


window.onresize = function(){

    checkmarquee();

    if(window.innerWidth >= 992){
        $('.category-boxes-wrapper .widget-inner:nth-of-type(2)').removeClass('visually-hidden');
        $('.category-boxes-mobile').addClass('visually-hidden');
    }else{
        $('.category-boxes-wrapper .widget-inner:nth-of-type(2)').addClass('visually-hidden');
        $('.category-boxes-mobile').removeClass('visually-hidden');
    }

    // if(window.innerWidth>=1200){
    //     $('.homepage-sale.overlay').removeClass('visually-hidden');
    //     $('.homepage-sale.bottom').removeClass('visually-hidden');
    //     $('.homepage-sale-mobileslider').addClass('visually-hidden');
    // }else{
    //     $('.homepage-sale.overlay').addClass('visually-hidden');
    //     $('.homepage-sale.bottom').addClass('visually-hidden');
    //     $('.homepage-sale-mobileslider').removeClass('visually-hidden');
    // }
}



function checkmarquee() {
    setTimeout(function(){
        if($('.pre-top ul').width() > $(window).width()){
            $('.pre-top ul').addClass('animated');
        }else{
            $('.pre-top ul').removeClass('animated');
        }
    },200);
}





function destroyOwlCarousel(carousel){
    carousel.trigger('destroy.owl.carousel');
}
function initializeOwlCarousel(carousel,loop,margin,nav,navText,items,autoWidth,responsive){
    carousel.owlCarousel({
        items:items,
        autoWidth: autoWidth,
        loop:loop,
        nav:nav,
        navText:navText,
        margin:margin,
        responsive:responsive
    })
}



// OBJECT FIT POLYFILL


// OBJECT FIT POLYFILL
;(function() {
    "use strict";
    if ("objectFit"in document.documentElement.style !== false) {
        window.objectFitPolyfill = function() {
            return false
        }
        ;
        return;
    }
    var checkParentContainer = function($container) {
        var styles = window.getComputedStyle($container, null);
        var position = styles.getPropertyValue("position");
        var overflow = styles.getPropertyValue("overflow");
        var display = styles.getPropertyValue("display");
        if (!position || position === "static") {
            $container.style.position = "relative";
        }
        if (overflow !== "hidden") {
            $container.style.overflow = "hidden";
        }
        if (!display || display === "inline") {
            $container.style.display = "block";
        }
        if ($container.clientHeight === 0) {
            $container.style.height = "100%";
        }
        if ($container.className.indexOf("object-fit-polyfill") === -1) {
            $container.className = $container.className + " object-fit-polyfill";
        }
    };
    var checkMediaProperties = function($media) {
        var styles = window.getComputedStyle($media, null);
        var constraints = {
            "max-width": "none",
            "max-height": "none",
            "min-width": "0px",
            "min-height": "0px",
            "top": "auto",
            "right": "auto",
            "bottom": "auto",
            "left": "auto",
            "margin-top": "0px",
            "margin-right": "0px",
            "margin-bottom": "0px",
            "margin-left": "0px",
        };
        for (var property in constraints) {
            var constraint = styles.getPropertyValue(property);
            if (constraint !== constraints[property]) {
                $media.style[property] = constraints[property];
            }
        }
    };
    var setPosition = function(axis, $media, objectPosition) {
        var position, other, start, end, side;
        objectPosition = objectPosition.split(" ");
        if (objectPosition.length < 2) {
            objectPosition[1] = objectPosition[0];
        }
        if (axis === "x") {
            position = objectPosition[0];
            other = objectPosition[1];
            start = "left";
            end = "right";
            side = $media.clientWidth;
        } else if (axis === "y") {
            position = objectPosition[1];
            other = objectPosition[0];
            start = "top";
            end = "bottom";
            side = $media.clientHeight;
        } else {
            return;
        }
        if (position === start || other === start) {
            $media.style[start] = "0";
            return;
        }
        if (position === end || other === end) {
            $media.style[end] = "0";
            return;
        }
        if (position === "center" || position === "50%") {
            $media.style[start] = "50%";
            $media.style["margin-" + start] = (side / -2) + "px";
            return;
        }
        if (position.indexOf("%") >= 0) {
            position = parseInt(position);
            if (position < 50) {
                $media.style[start] = position + "%";
                $media.style["margin-" + start] = side * (position / -100) + "px";
            } else {
                position = 100 - position;
                $media.style[end] = position + "%";
                $media.style["margin-" + end] = side * (position / -100) + "px";
            }
            return;
        } else {
            $media.style[start] = position;
        }
    };
    var objectFit = function($media) {
        var fit = ($media.dataset) ? $media.dataset.objectFit : $media.getAttribute("data-object-fit");
        var position = ($media.dataset) ? $media.dataset.objectPosition : $media.getAttribute("data-object-position");
        fit = fit || "cover";
        position = position || "50% 50%";
        var $container = $media.parentNode;
        checkParentContainer($container);
        checkMediaProperties($media);
        $media.style.position = "absolute";
        $media.style.height = "100%";
        $media.style.width = "auto";
        if (fit === "scale-down") {
            $media.style.height = "auto";
            if ($media.clientWidth < $container.clientWidth && $media.clientHeight < $container.clientHeight) {
                setPosition("x", $media, position);
                setPosition("y", $media, position);
            } else {
                fit = "contain";
                $media.style.height = "100%";
            }
        }
        if (fit === "none") {
            $media.style.width = "auto";
            $media.style.height = "auto";
            setPosition("x", $media, position);
            setPosition("y", $media, position);
        } else if (fit === "cover" && $media.clientWidth > $container.clientWidth || fit === "contain" && $media.clientWidth < $container.clientWidth) {
            $media.style.top = "0";
            $media.style.marginTop = "0";
            setPosition("x", $media, position);
        } else if (fit !== "scale-down") {
            $media.style.width = "100%";
            $media.style.height = "auto";
            $media.style.left = "0";
            $media.style.marginLeft = "0";
            setPosition("y", $media, position);
        }
    };
    var objectFitPolyfill = function() {
        var media = document.querySelectorAll("[data-object-fit]");
        for (var i = 0; i < media.length; i++) {
            var mediaType = media[i].nodeName.toLowerCase();
            if (mediaType === "img") {
                if (media[i].complete) {
                    objectFit(media[i]);
                } else {
                    media[i].addEventListener("load", function() {
                        objectFit(this);
                    });
                }
            } else if (mediaType === "video") {
                if (media[i].readyState > 0) {
                    objectFit(media[i]);
                } else {
                    media[i].addEventListener("loadedmetadata", function() {
                        objectFit(this);
                    });
                }
            }
        }
        return true;
    };
    document.addEventListener("DOMContentLoaded", function() {
        objectFitPolyfill();
    });
    window.addEventListener("resize", function() {
        objectFitPolyfill();
    });
    window.objectFitPolyfill = objectFitPolyfill;
}
)();
;(function($) {
    $('document').ready(function() {
        $('*').each(function() {
            var ffstring = $(this).css('font-family');
            var ofv, opv;
            if (ffstring.indexOf('object-fit:') != -1) {
                ofv = ffstring.split('object-fit:');
                ofv = ofv[1].split(';')[0].trim();
                $(this).attr('data-object-fit', ofv);
            }
            if (ffstring.indexOf('object-position:') != -1) {
                opv = ffstring.split('object-position:');
                opv = opv[1].split(';')[0].trim();
                $(this).attr('data-object-position', opv);
            }
        });
        if (typeof objectFitPolyfill !== "undefined") {
            objectFitPolyfill();
        }
    });
    $(window).on('load', function() {
        if (typeof objectFitPolyfill !== "undefined") {
            objectFitPolyfill();
        }
    });
}
)(jQuery);
