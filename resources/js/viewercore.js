// FISHER-Softmedia Deutschland
// 360° Viewer Loader - Single instance - 2022-04-05
'use strict';

// Default parameters
var fs360ViewerVersion  = '5.7.2.1';
var fs360ViewerUrl      = ('undefined' !== typeof _360g_viewer_url && _360g_viewer_url) ? _360g_viewer_url : ''; // With trailing slash!
var fs360ViewerDefaults = {
    wrapperWidth:       500,
    wrapperHeight:      500,
    $wrapperBorder:     null,
    wrapperBackground:  null,
    wrapperStyle:       '',
    imgX:               0,
    imgY:               0,
    imageType:          'jpg', // 'jpg' | 'png'
    imagePrefix:        '',
    numPix:             0, // Number of Images
    iSize:              1,
    savedWebp:          false,
    showWebp:           false,
    maxZoom:            1.5,
    mSense:             3,
    aSpeed:             200,
    aSpins:             'endless',
    uiButton:           'yes',
    uiControlStyle:     'background: #fff',
    macMsenseOffset:    0,
    spacingInPercent:   30, // 0 - 100
    rotateOnlyAfter:    false, // true | false
    rotateType:         'auto',
    startFullScreenDefault: false, // true | false
    fullscreenMode:     'wrapper', // "wrapper" | "document"
    helperShow:         false, // true | false
    helperHide:         '', // "5s" | "10s" | ???
    watermark:          {option: 'none', type: 'none', image: '', position: '', width: '', height: ''},
    helpButtonPosition: 'control', // control | left-top | left-bottom | right-top | right-bottom | hide
    uiControls:         ['play', 'rotate', 'shift', 'zoom_in', 'zoom_out', 'reset'],
    controlImages: {
        play: {
            active:     fs360ViewerUrl + 'template/img/buttons/btnAutoplay_active.png',
            inactive:   fs360ViewerUrl + 'template/img/buttons/btnAutoplay_inactive.png',
        },
        browse: {
            active:     fs360ViewerUrl + 'template/img/buttons/btnBrowse_active.png',
            inactive:   fs360ViewerUrl + 'template/img/buttons/btnBrowse_inactive.png',
        },
        shift: {
            active:     fs360ViewerUrl + 'template/img/buttons/btnShift_active.png',
            inactive:   fs360ViewerUrl + 'template/img/buttons/btnShift_inactive.png',
        },
        zoomin: {
            active:     fs360ViewerUrl + 'template/img/buttons/btnZoomIn_active.png',
            inactive:   fs360ViewerUrl + 'template/img/buttons/btnZoomIn_inactive.png',
        },
        zoomout: {
            active:     fs360ViewerUrl + 'template/img/buttons/btnZoomOut_active.png',
            inactive:   fs360ViewerUrl + 'template/img/buttons/btnZoomOut_inactive.png',
        },
        reset: {
            active:     fs360ViewerUrl + 'template/img/buttons/btnReset_active.png',
            inactive:   fs360ViewerUrl + 'template/img/buttons/btnReset_inactive.png',
        },
        help: {
            active:     fs360ViewerUrl + 'template/img/buttons/btnHelp_active.png',
            inactive:   fs360ViewerUrl + 'template/img/buttons/btnHelp_inactive.png',
        },
    },
}

fs360ViewerLoad();

/**
 * Select viewer.
 *
 * Examples:
 * <div id="test500" class="_360grad-viewer">360GradViewer</div>
 */
function fs360ViewerLoad() {
    let viewer_n        = document.querySelector('._360grad-viewer'),
        animation_name  = viewer_n ? viewer_n.getAttribute('id') : '',
        inside_lightbox = viewer_n.classList.contains('_360grad-lightbox'),
        config          = {};

    // Set configurations values
    // wrapperWidth, wrapperHeight, imgX, imgY, ...
    for (let _key in fs360ViewerDefaults) {
        config[_key]        = fs360ViewerDefaults[_key];
        if ('undefined' !== typeof window[_key])
            config[_key]   = window[_key];
    }

    let viewer = {
        name:           animation_name,
        config:         config,
        element:        viewer_n,
        instance:       null,
        detailUrl:      fs360ViewerUrl + '3d_artikel/' + animation_name + '/', // With trailing slash!
        lightbox:       inside_lightbox,
        studio:         'undefined' === typeof inside_studio ? false : inside_studio,
    };

    viewer.element.innerHTML    = fs360ViewerGetHtml(animation_name, config);
    viewer.instance             = new Fs360Viewer(viewer);

    let custom_styles = fs360ViewerCustomStyles(viewer);
    fs360ViewerStyles(custom_styles);

    // DEBUG:
    // console.log('fs360ViewerLoad()', viewer);
}

/**
 * Get viewer's html.
 *
 * @param {string} animation_name
 * @param {object} config
 * @return {string}
 */
function fs360ViewerGetHtml(animation_name, config) {
    let viewer_html = '' +
        '<div class="fs-viewer-wrapper">' +
        '<div class="fs-fullscreen-button fullscreen-off"></div>' +
        '<div class="fs-viewer-image-wrapper">' +
        '<img class="fs-viewer-image" src="" alt="" style="opacity:0" />';

    if ('undefined' !== typeof watermark && watermark.option === 'overlay') {
        let left  = 'initial',
            right = 'initial',
            top  = 'initial',
            bottom = 'initial',
            img_width = watermark.width ? watermark.width : 'auto',
            img_src = fs360ViewerUrl + '3d_artikel/' + animation_name + '/wasserzeichen/' + watermark.image,
            transform = 'none';

        if ('left_top' === watermark.position) {
            left = 0;
            top = 0;
        }
        else if ('left_bottom' === watermark.position) {
            left = 0;
            bottom = 0;
            transform = 'translate(0, -50px)';
        }
        else if ('right_top' === watermark.position) {
            right = 0;
            top = 0;
        }
        else if ('right_bottom' === watermark.position) {
            right = 0;
            bottom = 0;
            transform = 'translate(0, -50px)';
        }
        else if ('center' === watermark.position) {
            left = '50%';
            top = '50%';
            transform = 'translate(-50%,-50%)';
        }

        let overlay_style = `left: ${left}; top: ${top}; right: ${right}; bottom: ${bottom}; width: ${img_width}px; height: auto; transform: ${transform}`;
        viewer_html += '<img class="fs-viewer-overlay" width="' + img_width + '" src="' + img_src + '" style="' + overlay_style + '">';
    }

    viewer_html +=
        '</div>' +
        '<div class="fs-preloader">' +
        '<div class="fs-preloader-icon"></div>' +
        '<div class="fs-preloader-text"></div>' +
        '</div>' +

        '<ul class="fs-viewer-controls" style="display: none">';

    if (-1 < config.uiControls.indexOf('play'))
        viewer_html += '<li><img class="fs-play-button" alt="Play Button"><span class="tooltip play"></span></li>';
    if (-1 < config.uiControls.indexOf('rotate'))
        viewer_html += '<li><img class="fs-rotate-button" alt="Rotate Button"><span class="tooltip rotate"></span></li>';
    if (-1 < config.uiControls.indexOf('shift'))
        viewer_html += '<li><img class="fs-shift-button" alt="Shift Button"><span class="tooltip shift"></span></li>';
    if (-1 < config.uiControls.indexOf('zoom_in'))
        viewer_html += '<li><img class="fs-zoomin-button" alt="Zoom-In Button"><span class="tooltip zoomin"></span></li>';
    if (-1 < config.uiControls.indexOf('zoom_out'))
        viewer_html += '<li><img class="fs-zoomout-button" alt="Zoom-Out Button"><span class="tooltip zoomout"></span></li>';
    if (-1 < config.uiControls.indexOf('reset'))
        viewer_html += '<li><img class="fs-reset-button" alt="Reset Button"><span class="tooltip reset"></span></li>';

    if ('control' === helpButtonPosition)
        viewer_html += '<li><img class="fs-help-button" alt="Help Button"><span class="tooltip help"></span></li>';

    viewer_html += '</ul>';

    // Help-Button flex
    if (['left-top', 'left-bottom', 'right-top', 'right-bottom'].indexOf(helpButtonPosition) !== -1) {
        let _class = 'fs-helpflex ' + helpButtonPosition;
        viewer_html += '<div class="' + _class + '" style="display: none"><img class="fs-help-button" alt="Help Button"><span class="tooltip help"></span></div>';
    }

    viewer_html += '<div class="fs-helper"><img src="' + fs360ViewerUrl + 'template/img/start_helper.png" alt="360&deg;Viewer Hilfe Grafik"></div>' +
        '</div>'; // #fsWrapper

    return viewer_html;
}

function fs360ViewerCustomStyles(viewer) {
    let selector = `#${viewer.name}._360grad-viewer`,
        imageType = 'undefined' !== typeof viewer.config.imageType ? viewer.config.imageType : '',
        styles = '';

    if ('yes' === viewer.config.uiButton) {
        let uiControlStyle = fs360ViewerDefaults.uiControlStyle;
        if ('undefined' !== typeof viewer.config.uiControlStyle)
            uiControlStyle = viewer.config.uiControlStyle;

        if (uiControlStyle)
            styles += selector + ` .fs-viewer-controls {${uiControlStyle}}`;
    }

    if ('undefined' !== typeof viewer.config.wrapperStyle && viewer.config.wrapperStyle.length)
        styles += selector + ` .fs-viewer-wrapper {${viewer.config.wrapperStyle}}`;

    if ('png' === imageType) {
        if ('undefined' !== typeof viewer.config.wrapperBackground && viewer.config.wrapperBackground) {
            if ('image' === viewer.config.wrapperBackground.option) {
                let background_url = viewer.detailUrl + 'hintergrund/' + viewer.config.wrapperBackground.image,
                    background_css =
                        `background-image: url("${background_url}");` +
                        'background-repeat: no-repeat;' +
                        'background-size: cover;' +
                        'background-position: center;';
                styles += selector + ` .fs-viewer-wrapper {${background_css}}`;
            }
            else if ('color' === viewer.config.wrapperBackground.option) {
                let background_css = `background-color: ${viewer.config.wrapperBackground.color};`;
                styles += selector + ` .fs-viewer-wrapper {${background_css}}`;
            }
            else {
                styles += selector + ` .fs-viewer-wrapper {background-color: transparent;}`;
            }
        }
    }

    return styles;
}

/**
 * Load main styles and script.
 *
 * @param {String} custom
 */
function fs360ViewerStyles(custom = '') {
    // Load minified css
    let min_css = "._360grad-viewer._360grad-lightbox{position:static}._360grad-viewer._360grad-lightbox>._360grad-background{content:'';position:fixed;left:0;top:0;width:100%;height:100%;background:#fff;opacity:0;transition:.5s;z-index:1000}._360grad-viewer._360grad-lightbox>.fs-viewer-wrapper{display:none;position:fixed;left:50%;top:50%;transform:translate(-50%,-100%);transition:.5s;opacity:0;visibility:hidden;z-index:1000}._360grad-viewer._360grad-lightbox.opened>.fs-viewer-wrapper{display:block}._360grad-viewer._360grad-lightbox.show>._360grad-background{opacity:.9}._360grad-viewer._360grad-lightbox.show>.fs-viewer-wrapper{transform:translate(-50%,-50%);opacity:1;visibility:visible}.fs-viewer-wrapper{position:relative;max-width:100%;max-height:100vh;background-color:#fff;box-sizing:border-box;overflow:hidden;cursor:pointer;z-index:100;-webkit-touch-callout:none;-khtml-user-select:none;-moz-user-select:none;-webkit-user-select:none;-ms-user-select:none;user-select:none}.fs-viewer-wrapper.fullscreen{position:fixed;left:0;top:0;width:100%;height:100%;z-index:9999}.fs-viewer-wrapper.debug .fs-viewer-debug{display:block}.fs-viewer-wrapper.debug .fs-fullscreen-button,.fs-viewer-wrapper.debug .fs-helpflex,.fs-viewer-wrapper.debug .fs-viewer-image-wrapper{opacity:.5}.fs-viewer-debug{display:none;position:absolute;left:0;top:0;width:100%;height:100%;background:#000;color:#fff;padding:10px;box-sizing:border-box}.fs-viewer-image-wrapper{position:absolute;left:0;top:0;width:100%;height:100%;padding-bottom:50px;box-sizing:border-box;z-index:10}.fs-fullscreen-button{width:40px;height:40px;background-size:contain;background-position:center;background-repeat:no-repeat;position:absolute;right:10px;top:10px;z-index:15;cursor:pointer}.fs-fullscreen-button.fullscreen-on{background-image:url(template/img/buttons/btnFullscreen_active.png)}.fs-fullscreen-button.fullscreen-off{background-image:url(template/img/buttons/btnFullscreen_inactive.png)}.fs-preloader{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:150}.fs-preloader-icon{width:80px;height:80px;border-left:8px solid #0083dd;border-right:8px solid #0083dd;border-top:8px solid transparent;border-bottom:8px solid transparent;border-radius:50%;background:0 0;animation:viewer-preloader .8s linear infinite;-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.fs-preloader-text{position:absolute;left:0;top:0;display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:24px;color:#0284dd}.fs-viewer-wrapper.ui-buttons #preloader{top:calc(50% - 25px)}@keyframes viewer-preloader{0%{transform:rotate(0)}100%{transform:rotate(359deg)}}.fs-viewer-image{display:block;position:relative;top:0;left:0;margin:0;border:0;width:auto;height:100%;max-width:initial!important;max-height:initial!important;box-sizing:border-box;pointer-events:none;z-index:15;user-select:none;cursor:pointer}.fs-viewer-overlay{position:absolute;left:50%;top:50%;width:250px;height:auto;transform:translate(-50%,-50%);box-sizing:border-box;z-index:15;opacity:.5}.fs-viewer-controls{display:none;justify-content:center;position:absolute;left:0;bottom:0;padding:0;margin:0;width:100%;height:50px;box-sizing:border-box;border-radius:0;-webkit-border-radius:0;-moz-border-radius:0;z-index:15;-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;list-style-type:none}.fs-viewer-controls li{position:relative;display:inline-block;user-select:none;outline:0}.fs-helpflex img,.fs-viewer-controls li img{margin:0;margin-top:3px;margin-right:5px;padding:0;width:43px;height:43px;border:none;background-repeat:no-repeat;background-position:center;background-size:contain;background-color:transparent;outline:0;cursor:pointer}.fs-helpflex{display:none;position:absolute;z-index:100}.fs-helpflex.left-top{left:0;top:0}.fs-helpflex.left-bottom{left:0;bottom:0}.fs-helpflex.right-top{right:0;top:0}.fs-helpflex.right-bottom{right:0;bottom:0}.fs-helpflex:hover .tooltip,.fs-viewer-controls li:hover .tooltip{top:-45px;visibility:visible;opacity:1}.fs-helpflex .tooltip,.fs-viewer-controls li .tooltip{content:'';display:block;position:absolute;left:0;top:-30px;width:200px;height:50px;visibility:hidden;opacity:0;transition:.3s;transition-delay:.3s;background-repeat:no-repeat;background-position:left top;background-size:contain}.fs-helpflex.left-top:hover .tooltip,.fs-helpflex.right-top:hover .tooltip{top:45px;visibility:visible;opacity:1}.fs-helpflex.left-top .tooltip .fs-helpflex.right-top .tooltip{left:0;top:30px}.fs-viewer-controls .tooltip.play{background-image:url(template/img/tooltips/ttAutoPlay.png)}.fs-viewer-controls .tooltip.rotate{background-image:url(template/img/tooltips/ttRotate.png)}.fs-viewer-controls .tooltip.shift{background-image:url(template/img/tooltips/ttShift.png)}.fs-viewer-controls .tooltip.zoomin{background-image:url(template/img/tooltips/ttZoomIn.png)}.fs-viewer-controls .tooltip.zoomout{background-image:url(template/img/tooltips/ttZoomOut.png)}.fs-viewer-controls .tooltip.reset{background-image:url(template/img/tooltips/ttReset.png)}.fs-helpflex .tooltip.help,.fs-viewer-controls .tooltip.help{background-image:url(template/img/tooltips/ttHelp.png)}.fs-fullscreen-button:hover:after{top:50px;visibility:visible;opacity:1}.fs-fullscreen-button:after{content:'';display:block;position:absolute;right:0;top:30px;width:200px;height:50px;background-repeat:no-repeat;background-position:top right;background-size:auto 100%;visibility:hidden;opacity:0;transition:.3s;transition-delay:.3s}.fs-fullscreen-button.fullscreen-off:after{background-image:url(template/img/tooltips/ttFullScreen.png)}.fs-fullscreen-button.fullscreen-on:after{background-image:url(template/img/tooltips/ttFullScreenClose.png)}.fs-helper{display:block;position:absolute;left:50%;top:50%;z-index:100;transform:translate(-50%,-50%);cursor:pointer;visibility:hidden;opacity:0;transition:.5s}.fs-viewer-wrapper.ui-buttons .fs-helper{top:calc(50% - 25px)}.fs-helper.show{visibility:visible;opacity:.8}.fs-helper img{width:200px;height:auto;max-width:100%}.fs-contextmenu{position:fixed;display:block;z-index:1000;padding:1px;border:1px solid #f1f1f1;width:240px;height:110px;font-family:arial,helvetica,sans-serif;font-size:13px;font-weight:400;color:#000;background-color:#f0f0f0;cursor:pointer;opacity:.8;user-select:none}.fs-contextmenu a,.fs-contextmenu b,.fs-contextmenu p{display:block;margin:3px 2px;padding:0;font-family:arial,helvetica,sans-serif;font-size:13px;font-weight:400;line-height:22px;user-select:none}.fs-contextmenu p{color:#000}.fs-contextmenu p:hover{color:#fff;background-color:#ccc}.fs-contextmenu a{color:#000;text-decoration:none}.fs-contextmenu a:hover{color:#fff;text-decoration:none;background-color:#ccc}.fs-contextmenu b{color:#ccc}.fs-contextmenu b:hover{color:#fff;background-color:#ccc}.fs-contextmenu hr{margin:0;padding:0;border:none;border-top:1px solid #ccc;height:1px;color:#fff;background-color:#fff}.fsAnimation{-webkit-transition:all .5s linear;-moz-transition:all .5s linear;-ms-transition:all .5s linear;-o-transition:all .5s linear;transition:all .5s linear}.fsAnimation-100{-webkit-transition:all .1s ease-in-out;-moz-transition:all .1s ease-in-out;-ms-transition:all .1s ease-in-out;-o-transition:all .1s ease-in-out;transition:all .1s ease-in-out}.fsAnimation-150{-webkit-transition:all 150ms ease-in-out;-moz-transition:all 150ms ease-in-out;-ms-transition:all 150ms ease-in-out;-o-transition:all 150ms ease-in-out;transition:all 150ms ease-in-out}.fsAnimation-250{-webkit-transition:all 250ms ease-in-out;-moz-transition:all 250ms ease-in-out;-ms-transition:all 250ms ease-in-out;-o-transition:all 250ms ease-in-out;transition:all 250ms ease-in-out}.fsAnimation-500{-webkit-transition:all .5s ease-in-out;-moz-transition:all .5s ease-in-out;-ms-transition:all .5s ease-in-out;-o-transition:all .5s ease-in-out;transition:all .5s ease-in-out}.fsAnimation-1000{-webkit-transition:all 1s ease-in-out;-moz-transition:all 1s ease-in-out;-ms-transition:all 1s ease-in-out;-o-transition:all 1s ease-in-out;transition:all 1s ease-in-out}.fsAnimation-2000{-webkit-transition:all 2s linear;-moz-transition:all 2s linear;-ms-transition:all 2s linear;-o-transition:all 2s linear;transition:all 2s linear}.fsAnimation-4000{-webkit-transition:all 4s linear;-moz-transition:all 4s linear;-ms-transition:all 4s linear;-o-transition:all 4s linear;transition:all 4s linear}";
    min_css = min_css.replace(/template/g, fs360ViewerUrl + 'template');
    min_css += custom;
    let style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.appendChild(document.createTextNode(min_css));
    document.head && document.getElementsByTagName('head')[0].appendChild(style);
}

/**
 * function Fs360Viewer(viewer)
 */
function Fs360Viewer(s){for(var e in this.viewerImagePosition=0,fs360ViewerDefaults)this[e]=fs360ViewerDefaults[e],void 0!==s.config[e]&&(this[e]=s.config[e]);this.controlButtons={play:null,rotate:null,shift:null,zoomIn:null,zoomOut:null,reset:null,help:null,fullscreen:null};let g=this,t=!1,n="undefined"!=typeof fs360ViewerUrl?fs360ViewerUrl:"",F=void 0!==s.detailUrl?s.detailUrl:"",y=null,w=null,M=null,r=[],B=null,l={load:0,count:0,complete:!1},i=g.aSpeed,a=!1,X=0,Y=0;var N=0,c=!1;let b=g.iSize+g.maxZoom,L=g.iSize,u="fsAnimation-500",U=0,d="",I="";var W=0,m=0,f=!1,p=!1;let v=!1,V=0,h={x:0,y:0,lastX:0,lastY:0,downX:0,downY:0};var G,E=0,S="",x=0,z=0;if(A("Fs360Viewer::init("+s.name+")"),y=s.element.querySelector(".fs-viewer-wrapper")){if(y.style.width=g.wrapperWidth+"px",y.style.height=g.wrapperHeight+"px",g.debug&&((w=document.createElement("div")).classList.add("fs-viewer-debug"),w.appendChild(document.createTextNode("DEBUG")),y.insertBefore(w,y.firstChild),y.classList.add("debug")),y.classList.add("ui-buttons"),M=y.querySelector(".fs-viewer-image-wrapper"),B=y.querySelector(".fs-viewer-image"),g.controlButtons.play=y.querySelector(".fs-play-button"),g.controlButtons.rotate=y.querySelector(".fs-rotate-button"),g.controlButtons.shift=y.querySelector(".fs-shift-button"),g.controlButtons.zoomIn=y.querySelector(".fs-zoomin-button"),g.controlButtons.zoomOut=y.querySelector(".fs-zoomout-button"),g.controlButtons.reset=y.querySelector(".fs-reset-button"),g.controlButtons.help=y.querySelector(".fs-help-button"),g.controlButtons.fullscreen=y.querySelector(".fs-fullscreen-button"),"Mac OS"===function(){let e=window.navigator.userAgent,t=window.navigator.platform,o=null;-1!==["Macintosh","MacIntel","MacPPC","Mac68K"].indexOf(t)?o="Mac OS":-1!==["iPhone","iPad","iPod"].indexOf(t)?o="iOS":-1!==["Win32","Win64","Windows","WinCE"].indexOf(t)?o="Windows":/Android/.test(e)?o="Android":!o&&/Linux/.test(t)&&(o="Linux");return o}()&&(g.mSense+=g.macMsenseOffset),-1!==["tablet","mobile"].indexOf(Ee())&&(g.mSense+=4),A("DEBUG Device: "+Ee()),y){var R='<p onclick="print();">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Drucken...</p><hr><p id="custName">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&copy;&nbsp;360&deg;&nbsp;Animation</p><a href="https://www.fisher-softmedia.de" target="_blank">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Info&nbsp;&uuml;ber&nbsp;euroviewer</a><b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Version '+fs360ViewerVersion+"</b>";let e=document.createElement("div");e.classList.add("fs-contextmenu"),e.style.display="none",e.innerHTML=R,y.appendChild(e)}t=!0}if(t&&(window.addEventListener("resize",function(){O(),k()}),y.addEventListener("mousedown",oe),y.addEventListener("wheel",ne),y.addEventListener("contextmenu",se,!0),y.addEventListener("touchstart",re),y.addEventListener("touchend",ie),g.controlButtons.play&&(g.controlButtons.play.addEventListener("mouseup",ae),g.controlButtons.play.addEventListener("touchend",ae)),g.controlButtons.rotate&&(g.controlButtons.rotate.addEventListener("mouseup",ce),g.controlButtons.rotate.addEventListener("touchend",ce)),g.controlButtons.shift&&(g.controlButtons.shift.addEventListener("mouseup",ue),g.controlButtons.shift.addEventListener("touchend",ue)),g.controlButtons.zoomIn&&(g.controlButtons.zoomIn.addEventListener("mousedown",de),g.controlButtons.zoomIn.addEventListener("touchstart",de)),g.controlButtons.zoomOut&&(g.controlButtons.zoomOut.addEventListener("mousedown",me),g.controlButtons.zoomOut.addEventListener("touchstart",me)),g.controlButtons.reset&&(g.controlButtons.reset.addEventListener("mouseup",fe),g.controlButtons.reset.addEventListener("touchend",fe)),g.controlButtons.help&&(g.controlButtons.help.addEventListener("click",pe),g.controlButtons.help.addEventListener("touchend",pe)),g.controlButtons.fullscreen&&(g.controlButtons.fullscreen.addEventListener("mouseup",ge),g.controlButtons.fullscreen.addEventListener("touchend",ge)),y.addEventListener("fullscreenchange",ye,!0),y.addEventListener("webkitfullscreenchange",ye,!0)),t){let t=y.querySelector(".fs-viewer-controls"),o={count:0,loaded:0},n=0,s=0;for(var H in g.controlImages.help){let e=new Image;e.src=g.controlImages.help[H],e.onload=function(){if(++s===n){g.controlButtons.help&&(g.controlButtons.help.src=g.controlImages.help.inactive);let e=y.querySelector(".fs-helpflex");e&&(e.style.display="block")}},n++}if(t&&g.controlImages)for(var $ in g.controlImages)for(var Z in g.controlImages[$]){let e=new Image;e.src=g.controlImages[$][Z],e.onload=function(){o.loaded++,o.count===o.loaded&&(t.style.display="flex",D())},o.count++}}var _=function(){let e=y.querySelector(".fs-preloader"),t=!1;K(),s.lightbox||s.studio||!g.startFullScreenDefault||(t=!0);t?(o(!0),B.style.opacity=1,e.parentNode.removeChild(e),g.rotateOnlyAfter&&(B.style.opacity=N)):setTimeout(function(){B.classList.add("fsAnimation-1000"),B.style.opacity=1,g.rotateOnlyAfter?(i=200,B.style.opacity=N):setTimeout(function(){C(B),e.parentNode.removeChild(e)},1e3)},100);g.rotateOnlyAfter||J();s.lightbox||(Y=setTimeout(function(){V||P()},1e3))};if(t){l={count:0,load:0,complete:!1};for(let n=0;n<=g.numPix;n++){let e=10<=n?"":"0",t=F+"desktop/"+s.name+g.imagePrefix+e+n+"."+g.imageType;g.savedWebp&&g.showWebp&&(t=F+"desktop/webp/"+s.name+g.imagePrefix+e+n+".webp"),void 0!==g.watermark&&"image"===g.watermark.option&&(G=void 0!==g.watermark.imageType?g.watermark.imageType:"jpg",t=F+"wasserzeichen/"+s.name+g.imagePrefix+e+n+"."+G);let o=new Image;o.src=t,o.style.widht="0px",o.style.height="0px",o.style.visibility="hidden",o.onload=function(){l.load++,l.load===l.count&&(l.complete=!0,"function"==typeof _&&_())},l.count++,r[n]=o,M.appendChild(o)}}function K(){g.viewerImagePosition=0,g.scaler=g.iSize,I="fsRotate",L=g.iSize,B.src=r[g.viewerImagePosition].src,be(g.iSize),O(),k(),D()}function P(){a||(a=!0,I="fsRotate",clearInterval(X),X=setInterval(j,i))}function q(){return(!g.rotateOnlyAfter||!1!==c)&&(a=!1,clearTimeout(Y),clearInterval(X),g.controlButtons.play&&(y.querySelector(".tooltip.play").style.backgroundImage='url("'+n+'template/img/tooltips/ttAutoPlay.png")'),1)}function j(){g.controlButtons.play&&(g.controlButtons.play.src=g.controlImages.play.active,y.querySelector(".tooltip.play").style.backgroundImage='url("'+n+'template/img/tooltips/ttStopAnimation.png")');let e=y.querySelector(".fs-preloader"),t=y.querySelector(".fs-preloader-text");var o;g.viewerImagePosition++,"half_turn"===g.rotateType?(o=parseInt(g.numPix/2)+1,g.viewerImagePosition>o&&(g.viewerImagePosition=o,q(),g.rotateOnlyAfter&&!1===c&&(c=!0,i=g.aSpeed,B.style.opacity=1,J(),setTimeout(function(){C(B),e.parentNode.removeChild(e)},1e3)))):g.viewerImagePosition>g.numPix&&(g.viewerImagePosition=0,g.rotateOnlyAfter&&!1===c&&(c=!0,i=g.aSpeed,B.style.opacity=1,J(),q(),P(),setTimeout(function(){C(B),e.parentNode.removeChild(e)},1e3))),g.rotateOnlyAfter&&!1===c&&(t.innerText=parseInt(g.viewerImagePosition/g.numPix*100)+"%"),B.src=r[g.viewerImagePosition].src,O()}function J(){let e=y.querySelector(".fs-helper");g.helperShow&&(e.classList.add("show"),g.helperHide&&setTimeout(function(){e.classList.remove("show")},1e4))}function Q(e){e.preventDefault()}function ee(e){h.lastX=h.x,h.lastY=h.y,h.x=e.clientX,h.y=e.clientY}function te(e){window.removeEventListener("dragstart",Q),window.removeEventListener("mousemove",ee),window.removeEventListener("mousemove",ve),window.removeEventListener("mousemove",he),window.removeEventListener("mouseup",te),"move"===d&&(y.style.cursor=g.cursors.move),d=""}function oe(o){if(A("Fs360Viewer::onWrapperMouseDown("+o.clientX+", "+o.clientY+")",o.target),h.downX=o.clientX,h.downY=o.clientY,window.addEventListener("dragstart",Q),window.addEventListener("mousemove",ee),window.addEventListener("mouseup",te),ee(o),!o.target.parentNode.classList.contains("fs-contextmenu")&&!o.target.classList.contains("fs-play-button"))if(o.target.parentNode.classList.contains("fs-helper")||o.target.parentNode.classList.contains("fs-preloader")){let e=y.querySelector(".fs-helper");void(e&&e.classList.remove("show"))}else{if(V=Math.floor(Date.now()/1e3),a){if(!q())return;D()}let e=y.querySelector(".fs-contextmenu");if(e&&(e.style.display="none"),o.target!==g.controlButtons.help){let e=y.querySelector(".fs-helper");e&&e.classList.remove("show")}let t=!1;for(var n of["fs-viewer-image-wrapper","fs-viewer-image","fs-viewer-overlay"])o.target.classList.contains(n)&&(t=!0);t&&("fsRotate"===I?window.addEventListener("mousemove",ve):"move"===I&&(d="move",y.style.cursor="grab"===g.cursors.move?"grabbing":g.cursors.move,window.addEventListener("mousemove",he)))}}function ne(e){if(e.preventDefault(),B&&("zoom"===d||!d.length)){var t=(b-g.iSize)/5;if(e.deltaY<0){if(L+t>b)return L=b,!1;clearTimeout(m),B.addEventListener("transitionend",o),B.classList.add(u),T("INC",t)}else{if(L-t<g.iSize)return L=g.iSize,!1;clearTimeout(m),B.addEventListener("transitionend",o),B.classList.add(u),T("DEC",t)}d="zoom"}function o(){B.removeEventListener("transitionend",o),C(B),d=""}}function se(e){let t=y.querySelector(".fs-contextmenu");t.style.left=e.clientX+"px",t.style.top=e.clientY+"px",t.style.display="block",e.preventDefault()}function re(o){if(A("Fs360Viewer::onWrapperTouchStart("+o.touches[0].pageX+", "+o.touches[0].pageY+")"),o.preventDefault(),a){if(!q())return;D()}x=o.touches[0].pageX,z=o.touches[0].pageY,S="",E=0;let e=y.querySelector(".fs-contextmenu");if(e&&(e.style.display="none"),o.target!==g.controlButtons.help){let e=y.querySelector(".fs-helper"),t=(e&&e.classList.remove("show"),!1);for(var n of["fs-viewer-image-wrapper","fs-viewer-image"])o.target.classList.contains(n)&&(t=!0);t&&(D(),window.addEventListener("touchmove",le))}}function ie(e){A("Fs360Viewer::onWrapperTouchEnd()"),window.removeEventListener("touchmove",le),S=""}function le(e){let t=y.getBoundingClientRect(),o=B.getBoundingClientRect(),n=I,s=(e.stopPropagation(),B.classList.remove("fsAnimation"),e.touches[0].pageX),r=e.touches[0].pageY,i=s-x,l=r-z,a="none",c="none",u=o.width/100*g.spacingInPercent;a=s<x?"left":a,a=x<s?"right":a,c=r<z?"top":c,c=z<r?"down":c;var d,m,f,p,v,h=e;switch(2===h.touches.length&&(d=h.touches[0].clientX,m=h.touches[0].clientY,f=h.touches[1].clientX,h=h.touches[1].clientY,v=Math.abs(f-d),p=Math.abs(h-m),v=Math.sqrt(v*v+p*p),Math.abs(f-d),Math.abs(h-m),E?(w&&(w.innerHTML=`<div>move: ${v}</div>`+`<div>multiTouchDistance: ${E}</div>`+"<div>scale_value: 0.05</div>"),E+5<v?L+.05>b?L=b:(T("INC",.05,!1),E=v,S="fsZoomInTouch"):v<E-5&&(L-.05<g.iSize?L=g.iSize:(T("DEC",.05,!1),E=v,S="fsZoomOutTouch"))):E=v),S||2===e.touches.length&&(S="move"),n=S?S:n){case"fsRotate":g.controlButtons.rotate&&(g.controlButtons.rotate.src=g.controlImages.browse.active),Be(i);break;case"move":g.controlButtons.shift&&(g.controlButtons.shift.src=g.controlImages.shift.active),"left"===a&&o.right-t.left>u&&(B.style.left=parseInt(B.style.left)+i+"px",Math.abs(i)),"right"===a&&t.right-o.left>u&&(B.style.left=parseInt(B.style.left)+i+"px",Math.abs(i)),"top"===c&&o.bottom-t.top>u&&(B.style.top=parseInt(B.style.top)+l+"px",Math.abs(l)),"down"===c&&t.bottom-o.top>u&&(B.style.top=parseInt(B.style.top)+l+"px",Math.abs(l));break;case"fsZoomInTouch":case"fsZoomOutTouch":S=""}x=s,z=r}function ae(e){a?q()&&D():(D(),P())}function ce(e){q(),I="fsRotate",D(),g.controlButtons.rotate&&(g.controlButtons.rotate.src=g.controlImages.browse.active),y.style.cursor="ew-resize",L,L}function ue(e){q(),D(),I="move",g.controlButtons.shift&&(g.controlButtons.shift.src=g.controlImages.shift.active),y.style.cursor=g.cursors.move}function de(e){B&&(clearTimeout(m),B.addEventListener("transitionend",function e(){B.removeEventListener("transitionend",e);C(B)}),B.classList.add(u),T("INC"))}function me(e){B&&(B.addEventListener("transitionend",function e(){B.removeEventListener("transitionend",e);C(B)}),B.classList.add(u),T("DEC"))}function fe(e){B&&(B.classList.add("fsAnimation-150"),K(),m=setTimeout(function(){C(B)},250))}function pe(e){let t=y.querySelector(".fs-helper");t.classList.contains("show")?(t.classList.remove("show"),g.controlButtons.help&&(g.controlButtons.help.src=g.controlImages.help.inactive)):(t.classList.add("show"),g.controlButtons.help&&(g.controlButtons.help.src=g.controlImages.help.active))}function ve(e){!B||"rotate"!==d&&d.length||(d="rotate",y.style.cursor="w-resize",g.controlButtons.rotate&&(g.controlButtons.rotate.src=g.controlImages.browse.active),Be(h.x-h.lastX))}function he(e){if(B){var r=B.getBoundingClientRect(),i=y.getBoundingClientRect();g.controlButtons.rotate&&(g.controlButtons.shift.src=g.controlImages.shift.active),B.classList.remove("fsAnimation");let e=h.x-h.lastX,t=h.y-h.lastY,o="none",n="none",s=r.width/100*g.spacingInPercent;o=h.x<h.lastX?"left":o,o=h.x>h.lastX?"right":o,n=h.y<h.lastY?"top":n,n=h.y>h.lastY?"down":n,"left"===o&&r.right-i.left>s&&(B.style.left=parseInt(B.style.left)+e+"px"),"right"===o&&i.right-r.left>s&&(B.style.left=parseInt(B.style.left)+e+"px"),"top"===n&&r.bottom-i.top>s&&(B.style.top=parseInt(B.style.top)+t+"px"),"down"===n&&i.bottom-r.top>s&&(B.style.top=parseInt(B.style.top)+t+"px"),w&&(w.innerHTML=`<div>directionX: ${o}</div>`+`<div>moveX: ${e}</div>`+`<div>directionY: ${n}</div>`+`<div>moveY: ${t}</div>`)}}function ge(e){o(!f)}function ye(e){document.fullscreenElement||document.webkitFullscreenElement||o(!1)}function o(e=!1){if(!p)if(C(y),C(B),!0===e){if(!0!==f){if(A("Fs360Viewer::startFullscreen(On)"),p=!0,"wrapper"===g.fullscreenMode&&document.addEventListener("keyup",we),"document"===g.fullscreenMode){let e=!1;y.requestFullScreen?(y.requestFullScreen(),e=!0):y.webkitRequestFullScreen?(y.webkitRequestFullScreen(),e=!0):y.mozRequestFullScreen?(y.mozRequestFullScreen(),e=!0):y.requestFullscreen&&(y.requestFullscreen(),e=!0),e}y.classList.add("fsAnimation-100"),y.classList.add("fullscreen"),y.style="",y.addEventListener("transitionend",function e(){y.removeEventListener("transitionend",e);C(y);f=!0;p=!1;T();O();k();setTimeout(function(){B.classList.add("fsAnimation-500"),B.style.opacity=1,g.rotateOnlyAfter&&!c&&(B.style.opacity=N),B.addEventListener("transitionend",t)},100);P()}),B.style.opacity=0,g.controlButtons.fullscreen&&(g.controlButtons.fullscreen.classList.add("fullscreen-on"),g.controlButtons.fullscreen.classList.remove("fullscreen-off"))}function t(){B.removeEventListener("transitionend",t),C(B)}}else{if(!1!==f){if(A("Fs360Viewer::startFullscreen(Off)"),p=!0,"document"===g.fullscreenMode){let e=!1;document.cancelFullScreen?(document.cancelFullScreen(),e=!0):document.webkitCancelFullScreen?(document.webkitCancelFullScreen(),e=!0):document.mozCancelFullScreen?(document.mozCancelFullScreen(),e=!0):document.exitFullscreen&&(document.exitFullscreen(),e=!0),e}y.classList.add("fsAnimation-100"),y.style.width=g.wrapperWidth+"px",y.style.height=g.wrapperHeight+"px",y.addEventListener("transitionend",function e(){y.removeEventListener("transitionend",e);y.classList.remove("fullscreen");C(y);f=!1;p=!1;T();O();k();setTimeout(function(){B.classList.add("fsAnimation-500"),B.style.opacity=1,B.addEventListener("transitionend",o)},100)}),B.style.opacity="0",g.controlButtons.fullscreen&&(g.controlButtons.fullscreen.classList.remove("fullscreen-on"),g.controlButtons.fullscreen.classList.add("fullscreen-off"))}function o(){B.removeEventListener("transitionend",o),C(B)}}}function we(e){"Escape"===e.key&&(o(!1),document.removeEventListener("keyup",we))}function Be(e){!B||(W+=1)<g.mSense||((W=0)<e?g.viewerImagePosition--:e<0&&g.viewerImagePosition++,"half_turn"===g.rotateType?(e=Math.trunc(g.numPix/2),g.viewerImagePosition<0?g.viewerImagePosition=0:g.viewerImagePosition>e&&(g.viewerImagePosition=e+1)):g.viewerImagePosition<0?g.viewerImagePosition=g.numPix:g.viewerImagePosition>g.numPix&&(g.viewerImagePosition=0),B.src=r[g.viewerImagePosition].src)}function O(){var e,t,o,n;l.complete&&(e=Ie(B.parentNode),t=Le(B),o=v,n="yes"===g.uiButton?50:0,v=!1,B.style.display="block",B.style.position="absolute",1<e.ratio?A("DEBUG:","wrapper landscape"):A("DEBUG:","wrapper portrait"),1<t.ratio?(A("DEBUG:","image landscape"),B.style.width=e.width+"px",B.style.height="auto"):(t.ratio<1?A("DEBUG:","image portrait"):A("DEBUG:","image square"),B.style.width="auto",B.style.height=e.height-n+"px"),v=o)}function k(e){var t,o,n,s,r,i;l.complete&&(t=Ie(y),o=Le(B),s=n=0,r=v,i="yes"===g.uiButton?50:0,v=!1,B.style.display="block",B.style.position="absolute",e&&-1!==["horizontal","vertical","both"].indexOf(e)||(e="both"),s=(1<t.ratio?A("DEBUG:","wrapper landscape"):A("DEBUG:","wrapper portrait"),1<o.ratio?(A("DEBUG:","image landscape"),n=0,(t.height-i-B.offsetHeight)/2):(n=(o.ratio<1?A("DEBUG:","image portrait"):A("DEBUG:","image square"),(t.width-B.offsetWidth)/2),0)),n+=g.imgX,s+=g.imgY,"horizontal"===e?B.style.left=n+"px":("vertical"!==e&&(B.style.left=n+"px"),B.style.top=s+"px"),v=r)}function T(e="DEFAULT",t=.5,o=!0){if(!B)return!1;switch(e){case"INC":L+=t;break;case"DEC":L-=t;break;default:L=g.iSize}if(L>b)return L=b,!1;if(L<g.iSize)return L=g.iSize,!1;switch("DEC"===e&&(O(),o&&k()),be(L),e){case"INC":g.controlButtons.zoomIn&&(g.controlButtons.zoomIn.src=g.controlImages.zoomin.active),g.controlButtons.zoomOut&&(g.controlButtons.zoomOut.src=g.controlImages.zoomout.inactive);break;case"DEC":g.controlButtons.zoomIn&&(g.controlButtons.zoomIn.src=g.controlImages.zoomin.inactive),g.controlButtons.zoomOut&&(g.controlButtons.zoomOut.src=g.controlImages.zoomout.active)}return clearTimeout(U),U=setTimeout(function(){g.controlButtons.zoomIn&&(g.controlButtons.zoomIn.src=g.controlImages.zoomin.inactive),g.controlButtons.zoomOut&&(g.controlButtons.zoomOut.src=g.controlImages.zoomout.inactive)},500),!0}function be(e=1){B&&(B.style.transform="scale("+e+")",B.style.webkitTransform="scale("+e+")",B.style.MozTransform="scale("+e+")",B.style.msTransform="scale("+e+")",B.style.OTransform="scale("+e+")")}function Le(e){return e&&"img"===e.nodeName.toLowerCase()?{width:e.offsetWidth,height:e.offsetHeight,ratio:e.naturalWidth/e.naturalHeight,original:{width:e.naturalWidth,height:e.naturalHeight}}:null}function Ie(e){return e?{width:e.offsetWidth,height:e.offsetHeight,ratio:e.offsetWidth/e.offsetHeight}:null}function D(){A("Fs360Viewer::resetControlButtons()"),g.controlButtons.play&&(g.controlButtons.play.src=g.controlImages.play.inactive,document.querySelector(".tooltip.play").style.backgroundImage='url("'+n+'template/img/tooltips/ttAutoPlay.png")'),g.controlButtons.rotate&&(g.controlButtons.rotate.src=g.controlImages.browse.inactive),g.controlButtons.shift&&(g.controlButtons.shift.src=g.controlImages.shift.inactive),g.controlButtons.zoomIn&&(g.controlButtons.zoomIn.src=g.controlImages.zoomin.inactive),g.controlButtons.zoomOut&&(g.controlButtons.zoomOut.src=g.controlImages.zoomout.inactive),g.controlButtons.reset&&(g.controlButtons.reset.src=g.controlImages.reset.inactive),g.controlButtons.help&&(g.controlButtons.help.src=g.controlImages.help.inactive),y.style.cursor="default"}function C(o){if(o){let t=[];for(var e in o.classList){var n;isNaN(e)||(n=o.classList[e],-1!==o.classList[e].indexOf("fsAnimation")&&t.push(n))}for(let e=0;e<t.length;e++)o.classList.remove(t[e])}}function Ee(){var e=navigator.userAgent;return/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(e)?"tablet":/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(e)?"mobile":"desktop"}function A(e="DEBUG:",t=null){v&&(null!==t?console.log(e+" ->",t):console.log(e))}}