// FISHER-Softmedia Deutschland
// 360° Viewer Loader - Multiple instances - 2023-01-26
'use strict';

// Default parameters
var fs360ViewerVersion  = '5.11.0';
var fs360ViewerUrl      = ('undefined' !== typeof _360g_viewer_url && _360g_viewer_url) ? _360g_viewer_url : ''; // With trailing slash!
var fs360TemplateUrl    = ('undefined' !== typeof fs360TemplateUrl && fs360TemplateUrl) ? fs360TemplateUrl : fs360ViewerUrl + 'template/'; // With trailing slash!
var fs360ViewerDefaults = {
    wrapperWidth:       500,
    wrapperHeight:      500,
    wrapperBorder:      {'active': "0", "style": "solid", "width": 1, "color":"#3482d9", "radius": "0"},
    wrapperBackground:  null,
    wrapperStyle:       '',
    autoplay:           1, // 0 | 1
    autoplayRepeat:     0, // Number or 0 for endless
    imgX:               0,
    imgY:               0,
    imageType:          'jpg', // 'jpg' | 'png'
    imagePrefix:        '_',
    numPix:             0, // Number of Images
    iSize:              1,
    savedWebp:          false,
    showWebp:           false,
    maxZoom:            1.5,
    zoomLevel:          10, // 10 | 20 | 25 | 50
    mSense:             3,
    aSpeed:             200,
    aSpins:             'endless',
    uiButton:           'yes',
    uiControlStyle:     'background: #fff',
    macMsenseOffset:    0,
    spacingInPercent:   30, // 0 - 100
    rotateOnlyAfter:    false, // true | false
    rotateType:         'auto',
    rotateImage:        0,
    reversePlay:        false,
    startFullScreenDefault: false, // true | false
    fullscreenMode:     'wrapper', // "wrapper" | "document"
    helperShow:         false, // true | false
    helperHide:         '', // "5s" | "10s" | ???
    watermark:          {option: 'none', type: 'none', image: '', position: '', width: '', height: '', opacity: 0.5},
    helpButtonPosition: 'control', // control | left-top | left-bottom | right-top | right-bottom | hide
    features:           {},
    featureStyle:       {}, // {color: '#ffffff', background: '#ffffff'}
    uiConfigActive:     0,
    uiControlWidth:     1,
    uiControlColor:     '#ffffff',
    uiControlBackground: '#ffffff',
    uiControls:         ['play', 'rotate', 'shift', 'zoom_in', 'zoom_out', 'reset'],
    uiTooltip:          { duration: '0.3s', delay: '0.3s' },
    controlImages: {
        play: {
            active:     fs360TemplateUrl + 'img/buttons/btnAutoplay_active.png',
            inactive:   fs360TemplateUrl + 'img/buttons/btnAutoplay_inactive.png',
        },
        browse: {
            active:     fs360TemplateUrl + 'img/buttons/btnBrowse_active.png',
            inactive:   fs360TemplateUrl + 'img/buttons/btnBrowse_inactive.png',
        },
        shift: {
            active:     fs360TemplateUrl + 'img/buttons/btnShift_active.png',
            inactive:   fs360TemplateUrl + 'img/buttons/btnShift_inactive.png',
        },
        zoomin: {
            active:     fs360TemplateUrl + 'img/buttons/btnZoomIn_active.png',
            inactive:   fs360TemplateUrl + 'img/buttons/btnZoomIn_inactive.png',
        },
        zoomout: {
            active:     fs360TemplateUrl + 'img/buttons/btnZoomOut_active.png',
            inactive:   fs360TemplateUrl + 'img/buttons/btnZoomOut_inactive.png',
        },
        reset: {
            active:     fs360TemplateUrl + 'img/buttons/btnReset_active.png',
            inactive:   fs360TemplateUrl + 'img/buttons/btnReset_inactive.png',
        },
        help: {
            active:     fs360TemplateUrl + 'img/buttons/btnHelp_active.png',
            inactive:   fs360TemplateUrl + 'img/buttons/btnHelp_inactive.png',
        },
    },
    cursors: {
        move: 'move',
    },
    debug: false,
}

var fs360ViewerLoader = new Fs360ViewerLoader();

function Fs360ViewerLoader() {
    const self           = this,
          viewerSelector = '._360grad-viewer',
          debug          = false;

    this.viewers = [];

    /**
     * Init.
     */
    function init() {
        displayDebug('Fs360ViewerLoader::init()');

        selectViewers();
        loadViewers();

        let custom_styles = customStyles();

        loadStyles(custom_styles);
    }

    /**
     * Select all viewer.
     *
     * Examples:
     * <div class="_360grad-viewer" data-animation="test500">360GradViewer</div>
     * <div class="_360grad-viewer _360grad-lightbox" data-animation="test500">360GradViewer</div>
     */
    function selectViewers() {
        self.viewers = [];
        let viewer_nl = document.querySelectorAll(viewerSelector);

        displayDebug('Fs360ViewerLoader::selectViewers()', viewer_nl.length);

        for (let i = 0; i < viewer_nl.length; i++) {
            let viewer_n        = viewer_nl.item(i),
                viewer_name     = viewer_n.dataset['animation'],
                config_name     = getConfigName(viewer_name),
                inside_lightbox = viewer_n.classList.contains('_360grad-lightbox'),
                config          = fs360ViewerDefaults;

            if ('object' === typeof fs360ViewerConfigs && 'undefined' !== typeof fs360ViewerConfigs[config_name])
                config = fs360ViewerConfigs[config_name];

            let viewer = {
                name:           viewer_name,
                config:         config,
                element:        viewer_n,
                instance:       null,
                lightbox:       inside_lightbox,
                detailUrl:      fs360ViewerUrl,
                // detailUrl:      fs360ViewerUrl + '3d_artikel/' + viewer_name + '/',
                studio:         'undefined' === typeof inside_studio ? false : inside_studio,
            };

            self.viewers.push(viewer);
        }
    }

    /**
     * Load selected viewer.
     */
    function loadViewers() {
        displayDebug('Fs360ViewerLoader::loadViewers()', self.viewers);

        for (let viewer of self.viewers) {
            viewer.element.innerHTML    = createViewerHtml(viewer.name, viewer.config);
            viewer.instance             = new Fs360Viewer(viewer);
        }
    }

    /**
     * Get viewer's custom styles.
     *
     * @return {String}
     */
    function customStyles() {
        let styles = '';

        for (let viewer of self.viewers) {
            let selector = `._360grad-viewer[data-animation="${viewer.name}"]`,
                imageType = 'undefined' !== typeof viewer.config.imageType ? viewer.config.imageType : '';

            let uiTooltip   = 'undefined' !== typeof viewer.config.uiTooltip ? viewer.config.uiTooltip : fs360ViewerDefaults.uiTooltip,
                duration    = uiTooltip.duration,
                delay       = uiTooltip.delay;

            styles +=
                `${selector} .fs-button .tooltip { transition-duration: ${duration}; transition-delay: ${delay};} `;

            if ('yes' === viewer.config.uiButton) {
                let uiControlStyle = fs360ViewerDefaults.uiControlStyle;

                if ('undefined' !== typeof viewer.config.uiControlStyle)
                    uiControlStyle = viewer.config.uiControlStyle;

                if (uiControlStyle)
                    styles += `${selector} .fs-viewer-controls {${uiControlStyle}} `;
            }

            if ('undefined' !== typeof viewer.config.uiControlsStyle) {
                styles += viewer.config.uiControlsStyle + ' ';
            }

            if ('undefined' !== typeof viewer.config.wrapperStyle && viewer.config.wrapperStyle.length)
                styles += `${selector} .fs-viewer-wrapper {${viewer.config.wrapperStyle}} `;

            // if ('png' === imageType) {
                if ('undefined' !== typeof viewer.config.wrapperBackground && viewer.config.wrapperBackground) {
                    if ('image' === viewer.config.wrapperBackground.option) {
                        let background_url = viewer.detailUrl + 'hintergrund/' + viewer.config.wrapperBackground.image,
                            background_css =
                                `background-image: url("${background_url}");` +
                                'background-repeat: no-repeat;' +
                                'background-size: cover;' +
                                'background-position: center;';
                        styles += `${selector} .fs-viewer-wrapper {${background_css}} `;
                    }
                    else if ('color' === viewer.config.wrapperBackground.option) {
                        let background_css = `background-color: ${viewer.config.wrapperBackground.color};`;
                        styles += `${selector} .fs-viewer-wrapper {${background_css}} `;
                    }
                    // else {
                    //     styles += `${selector} .fs-viewer-wrapper {background-color: transparent;} `;
                    // }
                }
            // }

            // Features
            if (viewer.config && viewer.config.featureStyle) {
                let featureCss = '',
                    closeSvg   = '';

                if ('background' in viewer.config.featureStyle && viewer.config.featureStyle.background)
                    featureCss += `background-color: ${viewer.config.featureStyle.background}; `;

                if ('color' in viewer.config.featureStyle && viewer.config.featureStyle.color) {
                    featureCss += `color: ${viewer.config.featureStyle.color}; `;
                    closeSvg   += `fill: ${viewer.config.featureStyle.color}; `
                }

                if ('borderWidth' in viewer.config.featureStyle && viewer.config.featureStyle.borderWidth) {
                    featureCss += `border: ${viewer.config.featureStyle.borderWidth}px solid ${viewer.config.featureStyle.color}; `;
                }

                if (featureCss) {
                    styles += `${selector} .fs-feature {${featureCss}} `;
                    styles += `${selector} .fs-feature-close {${featureCss}} `;
                    styles += `${selector} .fs-feature-close svg g {${closeSvg}} `;
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
    function loadStyles(custom = '') {
        displayDebug('Fs360ViewerLoader::loadStyles()');

        // Load minified css
        let min_css = "._360grad-viewer._360grad-lightbox{position:static}._360grad-viewer._360grad-lightbox>._360grad-background{content:'';position:fixed;left:0;top:0;width:100%;height:100%;background:#fff;opacity:0;transition:.5s;z-index:1000}._360grad-viewer._360grad-lightbox>.fs-viewer-wrapper{display:none;position:fixed;left:50%;top:50%;transform:translate(-50%,-100%);transition:.5s;opacity:0;visibility:hidden;z-index:1000}._360grad-viewer._360grad-lightbox.opened>.fs-viewer-wrapper{display:block}._360grad-viewer._360grad-lightbox.show>._360grad-background{opacity:.9}._360grad-viewer._360grad-lightbox.show>.fs-viewer-wrapper{transform:translate(-50%,-50%);opacity:1;visibility:visible}.fs-button .tooltip.play{background-image:url(template/img/tooltips/ttStart.png)}.fs-button .tooltip.rotate{background-image:url(template/img/tooltips/ttRotate.png)}.fs-button .tooltip.shift{background-image:url(template/img/tooltips/ttShift.png)}.fs-button .tooltip.zoomin{background-image:url(template/img/tooltips/ttZoomIn.png)}.fs-button .tooltip.zoomout{background-image:url(template/img/tooltips/ttZoomOut.png)}.fs-button .tooltip.reset{background-image:url(template/img/tooltips/ttReset.png)}.fs-button .tooltip.help{background-image:url(template/img/tooltips/ttHelp.png_leftBottom.png)}.fs-fullscreen-button.fullscreen-on .tooltip{background-image:url(template/img/tooltips/ttFullScreen.png)}.fs-fullscreen-button.fullscreen-off .tooltip{background-image:url(template/img/tooltips/ttFullScreenClose.png)}.fs-helpflex.left-top .tooltip{background-image:url(template/img/tooltips/ttHelp.png_leftTop.png)}.fs-helpflex.left-bottom .tooltip{background-image:url(template/img/tooltips/ttHelp.png_leftBottom.png)}.fs-helpflex.right-top .tooltip{background-image:url(template/img/tooltips/ttHelp.png_rightTop.png)}.fs-helpflex.right-bottom .tooltip{background-image:url(template/img/tooltips/ttHelp.png_rightBottom.png)}.fs-viewer-wrapper{position:relative;max-width:100%;max-height:100vh;background-color:#fff;box-sizing:border-box;overflow:hidden;cursor:pointer;z-index:100;-webkit-touch-callout:none;-khtml-user-select:none;-moz-user-select:none;-webkit-user-select:none;-ms-user-select:none;user-select:none}.fs-viewer-wrapper.fullscreen{position:fixed;left:0;top:0;width:100%;height:100%;z-index:9999}.fs-viewer-wrapper.debug .fs-viewer-debug{display:block}.fs-viewer-wrapper.debug .fs-fullscreen-button,.fs-viewer-wrapper.debug .fs-helpflex,.fs-viewer-wrapper.debug .fs-viewer-image-wrapper{opacity:.5}.fs-viewer-debug{display:none;position:absolute;left:0;top:0;width:100%;height:100%;background:#000;color:#fff;padding:10px;box-sizing:border-box;font-family:sans-serif}.fs-viewer-image-wrapper{position:absolute;left:0;top:0;width:100%;height:100%;padding-bottom:50px;box-sizing:border-box;z-index:10}.fs-preloader{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:150}.fs-preloader-icon{width:80px;height:80px;border-left:8px solid #0083dd;border-right:8px solid #0083dd;border-top:8px solid transparent;border-bottom:8px solid transparent;border-radius:50%;background:0 0;animation:viewer-preloader .8s linear infinite;-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.fs-preloader-text{position:absolute;left:0;top:0;display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:24px;color:#0284dd}.fs-viewer-wrapper.ui-buttons #preloader{top:calc(50% - 25px)}.fs-button{padding:0;border:none;background:0 0;cursor:pointer}@keyframes viewer-preloader{0%{transform:rotate(0)}100%{transform:rotate(359deg)}}.fs-viewer-image{display:block;position:relative;top:0;left:0;margin:0;border:0;width:auto;height:100%;max-width:initial!important;max-height:initial!important;box-sizing:border-box;pointer-events:none;z-index:15;user-select:none;cursor:pointer}.fs-viewer-overlay{position:absolute;left:50%;top:50%;width:50%;height:auto;transform:translate(-50%,-50%);box-sizing:border-box;z-index:15;opacity:.5}.fs-viewer-front{position:absolute;left:0;right:0;top:0;bottom:0;z-index:20}@media (max-width:1024px){.fs-viewer-controls{display:none;justify-content:center;position:absolute;left:0;bottom:0;padding:0;margin:0;width:100%;z-index:15;list-style-type:none;-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.fs-viewer-controls li:last-child{margin-right:0}.fs-viewer-controls li{position:relative;margin-top:3px;margin-bottom:3px;margin-right:10px}.fs-button.active svg .fs-icon{stroke:#a0bf38}.fs-button.active svg .fs-icon-fill{fill:#a0bf38}.fs-button svg{display:block;width:30px;height:30px}.fs-button svg>g{fill:#fff}.fs-button.fs-help-button svg{margin-top:5px;width:20px;height:20px}.fs-button svg .fs-icon{stroke:#3482d9}.fs-button svg .fs-icon-fill{fill:#3482d9}.fs-viewer-controls .fs-button.hover .tooltip{opacity:1;visibility:visible;transform:translateY(-50px)}.fs-viewer-controls .fs-help-button.hover .tooltip{opacity:1;visibility:visible;transform:translateY(-43px)}.fs-button .tooltip{display:block;position:absolute;left:-8px;top:0;width:150px;height:50px;opacity:0;visibility:hidden;background-repeat:no-repeat;background-position:left top;background-size:contain;transform:translateY(0);transition:.3s;transition-delay:.3s}.fs-button .tooltip.help{left:initial;right:-5px;background-position:4px}.fs-helpflex{position:absolute;width:30px;height:30px;z-index:100;cursor:pointer}.fs-helpflex.left-top{top:8px;left:5px}.fs-helpflex.left-bottom{left:5px;bottom:10px}.fs-helpflex.right-top{top:8px;right:5px}.fs-helpflex.right-bottom{right:5px;bottom:10px}.fs-helpflex.hover .tooltip{opacity:1;visibility:visible}.fs-helpflex.left-top.hover .tooltip,.fs-helpflex.right-top.hover .tooltip{transform:translateY(45px)}.fs-helpflex.left-bottom.hover .tooltip,.fs-helpflex.right-bottom.hover .tooltip{transform:translateY(-45px)}.fs-helpflex.left-top .tooltip{left:-8px;background-position:-40px}.fs-helpflex.left-bottom .tooltip{left:-8px;background-position:-40px}.fs-helpflex.right-top .tooltip{left:initial;right:-10px;background-position:right}.fs-helpflex.right-bottom .tooltip{left:initial;right:-10px;background-position:right}.fs-fullscreen-button{position:absolute;top:10px;right:10px;width:30px;height:30px;z-index:15;cursor:pointer}.fs-fullscreen-button svg{width:100%;height:100%}.fs-fullscreen-button:hover svg .fs-icon{stroke:#a0bf38}.fs-fullscreen-button svg.fs-fullscreen-off,.fs-fullscreen-button svg.fs-fullscreen-on{display:none}.fs-fullscreen-button.fullscreen-on svg.fs-fullscreen-on{display:block}.fs-fullscreen-button.fullscreen-off svg.fs-fullscreen-off{display:block}.fs-fullscreen-button.hover .tooltip{opacity:1;visibility:visible;transform:translateY(45px)}.fs-fullscreen-button .tooltip{left:initial;right:0}.fs-fullscreen-button.fullscreen-on .tooltip{background-position:5px}}@media (min-width:1025px){.fs-viewer-controls{display:none;justify-content:center;position:absolute;left:0;bottom:0;padding:0;margin:0;width:100%;height:50px;z-index:15;box-sizing:border-box;-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;list-style-type:none}.fs-viewer-controls li:last-child{margin-right:0}.fs-viewer-controls li{position:relative;margin-top:3px;margin-right:5px}.fs-button.active svg .fs-icon{stroke:#a0bf38}.fs-button.active svg .fs-icon-fill{fill:#a0bf38}.fs-button svg{width:43px;height:43px}.fs-button svg>g{fill:#fff}.fs-button.fs-help-button svg{width:43px;height:25px;margin-top:6px}.fs-button svg .fs-icon{stroke:#3482d9}.fs-button svg .fs-icon-fill{fill:#3482d9}.fs-viewer-controls .fs-button:hover .tooltip{opacity:1;visibility:visible;transform:translateY(-50px)}.fs-viewer-controls .fs-help-button:hover .tooltip{opacity:1;visibility:visible;transform:translateY(-43px)}.fs-button .tooltip{display:block;position:absolute;left:0;top:0;width:150px;height:50px;opacity:0;visibility:hidden;background-repeat:no-repeat;background-position:left top;background-size:contain;transform:translateY(0);transition:.3s;transition-delay:.3s}.fs-button .tooltip.help{background-position:-40px}.fs-helpflex{position:absolute;width:40px;height:40px;z-index:100;cursor:pointer}.fs-helpflex.left-top{top:8px;left:12px}.fs-helpflex.left-bottom{left:12px;bottom:8px}.fs-helpflex.right-top{top:12px;right:10px}.fs-helpflex.right-bottom{right:12px;bottom:8px}.fs-helpflex:hover .tooltip{opacity:1;visibility:visible}.fs-helpflex.left-top:hover .tooltip,.fs-helpflex.right-top:hover .tooltip{transform:translateY(45px)}.fs-helpflex.left-bottom:hover .tooltip,.fs-helpflex.right-bottom:hover .tooltip{transform:translateY(-45px)}.fs-helpflex.left-top .tooltip{background-position:-40px}.fs-helpflex.left-bottom .tooltip{background-position:-40px}.fs-helpflex.right-top .tooltip{left:initial;right:0;background-position:right}.fs-helpflex.right-bottom .tooltip{left:initial;right:0;background-position:right}.fs-fullscreen-button{position:absolute;top:10px;right:10px;width:40px;height:40px;z-index:15;cursor:pointer}.fs-fullscreen-button:hover svg .fs-icon{stroke:#a0bf38}.fs-fullscreen-button svg{width:100%;height:100%}.fs-fullscreen-button svg.fs-fullscreen-off,.fs-fullscreen-button svg.fs-fullscreen-on{display:none}.fs-fullscreen-button.fullscreen-on svg.fs-fullscreen-on{display:block}.fs-fullscreen-button.fullscreen-off svg.fs-fullscreen-off{display:block}.fs-fullscreen-button:hover .tooltip{opacity:1;visibility:visible;transform:translateY(45px)}.fs-fullscreen-button .tooltip{left:initial;right:0}.fs-fullscreen-button.fullscreen-on .tooltip{background-position:5px}}.fs-helper{display:block;position:absolute;left:50%;top:50%;z-index:100;transform:translate(-50%,-50%);cursor:pointer;visibility:hidden;opacity:0;transition:.5s}.fs-viewer-wrapper.ui-buttons .fs-helper{top:calc(50% - 25px)}.fs-helper.show{visibility:visible;opacity:.8}.fs-helper img{width:200px;height:auto;max-width:100%}.fs-contextmenu{position:fixed;display:block;z-index:1000;padding:1px;border:1px solid #f1f1f1;width:240px;height:110px;font-family:arial,helvetica,sans-serif;font-size:13px;font-weight:400;color:#000;background-color:#f0f0f0;cursor:pointer;opacity:.95;user-select:none}.fs-contextmenu a,.fs-contextmenu b,.fs-contextmenu p{display:block;margin:3px 2px;padding:0;font-family:arial,helvetica,sans-serif;font-size:13px;font-weight:400;line-height:22px;user-select:none}.fs-contextmenu p{color:#000}.fs-contextmenu p:hover{color:#fff;background-color:#ccc}.fs-contextmenu a{color:#000;text-decoration:none}.fs-contextmenu a:hover{color:#fff;text-decoration:none;background-color:#ccc}.fs-contextmenu b:hover{color:#fff;background-color:#ccc}.fs-contextmenu hr{margin:0;padding:0;border:none;border-top:1px solid #ccc;height:1px;color:#fff;background-color:#fff}.fsAnimation{-webkit-transition:all .5s linear;-moz-transition:all .5s linear;-ms-transition:all .5s linear;-o-transition:all .5s linear;transition:all .5s linear}.fsAnimation-100{-webkit-transition:all .1s ease-in-out;-moz-transition:all .1s ease-in-out;-ms-transition:all .1s ease-in-out;-o-transition:all .1s ease-in-out;transition:all .1s ease-in-out}.fsAnimation-150{-webkit-transition:all 150ms ease-in-out;-moz-transition:all 150ms ease-in-out;-ms-transition:all 150ms ease-in-out;-o-transition:all 150ms ease-in-out;transition:all 150ms ease-in-out}.fsAnimation-250{-webkit-transition:all 250ms ease-in-out;-moz-transition:all 250ms ease-in-out;-ms-transition:all 250ms ease-in-out;-o-transition:all 250ms ease-in-out;transition:all 250ms ease-in-out}.fsAnimation-500{-webkit-transition:all .5s ease-in-out;-moz-transition:all .5s ease-in-out;-ms-transition:all .5s ease-in-out;-o-transition:all .5s ease-in-out;transition:all .5s ease-in-out}.fsAnimation-1000{-webkit-transition:all 1s ease-in-out;-moz-transition:all 1s ease-in-out;-ms-transition:all 1s ease-in-out;-o-transition:all 1s ease-in-out;transition:all 1s ease-in-out}.fsAnimation-2000{-webkit-transition:all 2s linear;-moz-transition:all 2s linear;-ms-transition:all 2s linear;-o-transition:all 2s linear;transition:all 2s linear}.fsAnimation-4000{-webkit-transition:all 4s linear;-moz-transition:all 4s linear;-ms-transition:all 4s linear;-o-transition:all 4s linear;transition:all 4s linear}.fs-features{display:flex;flex-flow:column;position:relative;z-index:20;margin-left:15px;margin-top:15px;width:60px}.fs-features.opened .fs-feature::after{opacity:1}.fs-features.opened .fs-feature-close{transform:rotate(180deg)}.fs-features.closed .fs-feature::after{opacity:0}.fs-feature{display:flex;flex-flow:nowrap;justify-content:center;align-items:center;position:absolute;left:0;top:0;border-radius:50%;width:60px;height:60px;background:#3482d9;color:#fff;font-family:sans-serif;font-weight:600;font-size:14px;text-align:center;transition:top .5s}.fs-feature::after{content:'';position:absolute;margin-left:110px;width:30px;height:30px;background-repeat:no-repeat;background-position:center;background-size:contain;transition:.1s}.fs-feature.fs-width-feature::after{background-image:url(template/img/features/width.png)}.fs-feature.fs-height-feature::after{background-image:url(template/img/features/height.png)}.fs-feature.fs-weight-feature::after{background-image:url(template/img/features/weight.png)}.fs-feature.fs-color-feature::after{background-image:url(template/img/features/color.png)}.fs-feature-close{display:flex;justify-content:center;align-items:center;position:absolute;left:0;top:0;width:60px;height:60px;z-index:10;border-radius:50%;cursor:pointer;transition:top .5s}.fs-feature-close svg{width:30px;height:30px}.fs-viewer-special-christmas .fs-viewer-front{background-image:url(template/img/snow/snow1.png),url(template/img/snow/snow2.png),url(template/img/snow/snow3.png);-webkit-animation:schnee 25s linear infinite;-moz-animation:schnee 25s linear infinite;-ms-animation:schnee 25s linear infinite;animation:schnee 25s linear infinite}.fs-viewer-front-to-back .fs-viewer-front{z-index:10}@keyframes schnee{0%{background-position:0 0,0 0,0 0}100%{background-position:500px 1000px,400px 400px,300px 300px}}";
        min_css = min_css.replace(/template/g, fs360TemplateUrl);
        min_css += custom;
        let style = document.createElement('style');
        style.setAttribute('type', 'text/css');
        style.appendChild(document.createTextNode(min_css));
        document.head && document.getElementsByTagName('head')[0].appendChild(style);
    }

    /**
     * Center all viewer.
     */
    this.centerViewers = function () {
        for (let viewer of self.viewers) {
            viewer.instance.setImageSize();
            viewer.instance.imageToCenter();
        }
    }

    function getViewerByName(viewer_name) {
        for (let viewer of self.viewers) {
            if (viewer_name === viewer.name) {
                return viewer;
            }
        }

        return null;
    }

    /**
     * Get viewer's html.
     *
     * @param {string} viewer_name
     * @param {object} config
     * @return {string}
     */
    function createViewerHtml(viewer_name, config) {
        let viewer_html =
            '<div class="fs-viewer-wrapper">' +
            '<button class="fs-button fs-fullscreen-button fullscreen-on"><span class="tooltip fullscreen"></span>' +
                '<svg class="fs-fullscreen-on" width="25px" height="25px" viewBox="0 0 25 25" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
                '<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round">' +
                '<g class="fs-icon" transform="translate(-655.000000, -18.000000)" stroke="#3482D9" stroke-width="2">' +
                '<g transform="translate(656.000000, 19.000000)">' +
                '<line x1="0.392825302" y1="22.6071747" x2="22.6070961" y2="0.392903867" id="Stroke-1"></line>' +
                '<line x1="0.392825302" y1="0.392825302" x2="22.6070961" y2="22.6070961" id="Stroke-3"></line>' +
                '<line x1="0.392825302" y1="7.11980147" x2="0.392825302" y2="0.393060997" id="Stroke-5"></line>' +
                '<line x1="7.11980147" y1="0.392825302" x2="0.393060997" y2="0.392825302" id="Stroke-7"></line>' +
                '<line x1="15.8801985" y1="0.392825302" x2="22.606939" y2="0.392825302" id="Stroke-9"></line>' +
                '<line x1="22.6071747" y1="7.11980147" x2="22.6071747" y2="0.393060997" id="Stroke-11"></line>' +
                '<line x1="22.6071747" y1="15.8801985" x2="22.6071747" y2="22.606939" id="Stroke-13"></line>' +
                '<line x1="15.8801985" y1="22.6071747" x2="22.606939" y2="22.6071747" id="Stroke-15"></line>' +
                '<line x1="7.11980147" y1="22.6071747" x2="0.393060997" y2="22.6071747" id="Stroke-17"></line>' +
                '<line x1="0.392825302" y1="15.8801985" x2="0.392825302" y2="22.606939" id="Stroke-19"></line>' +
                '</g>' +
                '</g>' +
                '</g>' +
                '</svg>' +

                '<svg class="fs-fullscreen-off" width="25px" height="25px" viewBox="0 0 25 25" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
                '<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round">' +
                '<g class="fs-icon" transform="translate(-617.000000, -18.000000)" stroke="#3482D9" stroke-width="2">' +
                '<g transform="translate(618.000000, 19.000000)">' +
                '<polyline id="Stroke-1" points="23 0 16.0003784 6.99962158 23 6.99962158 16.0003784 6.99962158 16.0003784 0"></polyline>' +
                '<polyline id="Stroke-3" points="0 0 6.99962158 6.99962158 6.99962158 0 6.99962158 6.99962158 0 6.99962158"></polyline>' +
                '<polyline id="Stroke-5" points="0 23 6.99962158 16.0003784 0 16.0003784 6.99962158 16.0003784 6.99962158 23"></polyline>' +
                '<polyline id="Stroke-7" points="23 23 16.0003784 16.0003784 16.0003784 23 16.0003784 16.0003784 23 16.0003784"></polyline>' +
                '</g>' +
                '</g>' +
                '</g>' +
                '</svg>' +
            '</button>' +
            '<div class="fs-viewer-image-wrapper">' +
            '<img class="fs-viewer-image" src="" alt="" style="opacity:0" />';

        if (config.watermark && config.watermark.option === 'overlay') {
            let left      = 'initial',
                right     = 'initial',
                top       = 'initial',
                bottom    = 'initial',
                img_width = config.watermark.width ? config.watermark.width : 'auto',
                img_src   = fs360ViewerUrl + '/wasserzeichen/' + config.watermark.image,
                transform = 'none',
                opacity   = config.watermark.opacity;

            if (img_width.indexOf('%') === -1)
                img_width += 'px';

            if ('left_top' === config.watermark.position) {
                top = 0;
                left = 0;
            }
            else if ('left_bottom' === config.watermark.position) {
                left = 0;
                bottom = 0;
                transform = 'translate(0, -50px)';
            }
            else if ('right_top' === config.watermark.position) {
                top = 0;
                right = 0;
            }
            else if ('right_bottom' === config.watermark.position) {
                right = 0;
                bottom = 0;
                transform = 'translate(0, -50px)';
            }
            else if ('center' === config.watermark.position) {
                left = '50%';
                top = '50%';
                transform = 'translate(-50%,-50%)';
            }

            let overlay_style = `left: ${left}; top: ${top}; right: ${right}; bottom: ${bottom}; width: ${img_width}; height: auto; transform: ${transform}; opacity: ${opacity};`;
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
            viewer_html +=
                '<li><button type="button" class="fs-button fs-play-button"><span class="tooltip play"></span>' +
                '<svg width="36px" height="36px" viewBox="0 0 36 36" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
                '<g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round">' +
                '<g class="fs-icon" transform="translate(2.000000, 2.000000)" stroke="#3482D9" stroke-width="2.1">' +
                '<path d="M32,16 C32,24.8361739 24.8361739,32 16,32 C7.16382609,32 0,24.8361739 0,16 C0,7.16382609 7.16382609,0 16,0 C24.8361739,0 32,7.16382609 32,16 Z" id="Stroke-1"></path>' +
                '<polygon class="fs-icon-fill" points="11.059687 9.536 11.059687 22.0695652 23.5932522 15.8031304"></polygon>' +
                '</g>' +
                '</g>' +
                '</svg>' +
                '</button></li>';
        if (-1 < config.uiControls.indexOf('rotate'))
            viewer_html +=
                '<li><button type="button" class="fs-button fs-rotate-button"><span class="tooltip rotate"></span>' +
                '<svg width="36px" height="36px" viewBox="0 0 36 36" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
                '<g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round">' +
                '<g class="fs-icon" transform="translate(-309.000000, -470.000000)" stroke="#3482D9" stroke-width="2.1">' +
                '<g id="Group-7" transform="translate(310.697284, 472.000000)">' +
                '<path d="M0,16 C0,7.16382609 7.22131358,0 16.1283951,0 C25.0354765,0 32.2567901,7.16382609 32.2567901,16 C32.2567901,24.8361739 25.0354765,32 16.1283951,32 C7.22131358,32 0,24.8361739 0,16 Z" id="Stroke-9"></path>' +
                '<polyline id="Stroke-11" points="23.8419753 9.6786087 20.4879704 9.6786087 20.4879704 13.005913"></polyline>' +
                '<path d="M20.4882509,9.68862609 C22.5141175,11.0660174 23.8422558,13.3783652 23.8422558,16.0002783 C23.8422558,20.2256696 20.3879743,23.6524522 16.1286756,23.6524522 C11.8693768,23.6524522 8.41509531,20.2256696 8.41509531,16.0002783 C8.41509531,11.774887 11.8693768,8.34810435 16.1286756,8.34810435" id="Stroke-13"></path>' +
                '</g>' +
                '</g>' +
                '</g>' +
                '</svg>' +
                '</button></li>';
        if (-1 < config.uiControls.indexOf('shift'))
            viewer_html +=
                '<li><button type="button" class="fs-button fs-shift-button"><span class="tooltip shift"></span>' +
                '<svg width="35px" height="36px" viewBox="0 0 35 36" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
                '<g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round">' +
                '<g class="fs-icon" transform="translate(-360.000000, -470.000000)" stroke="#3482D9" stroke-width="2.1">' +
                '<g id="Group-12" transform="translate(361.045926, 472.000000)">' +
                '<g id="Group-6">' +
                '<path d="M0,16 C0,7.16382609 7.22131358,0 16.1283951,0 C25.0354765,0 32.2567901,7.16382609 32.2567901,16 C32.2567901,24.8361739 25.0354765,32 16.1283951,32 C7.22131358,32 0,24.8361739 0,16 Z" id="Stroke-25"></path>' +
                '<line x1="16.1283951" y1="23.9743304" x2="16.1283951" y2="7.97433043" id="Stroke-27"></line>' +
                '<line x1="18.375361" y1="21.3582609" x2="16.1286054" y2="23.9746087" id="Stroke-29"></line>' +
                '<line x1="13.8814291" y1="21.3582609" x2="16.1281847" y2="23.9746087" id="Stroke-31"></line>' +
                '<line x1="13.8814291" y1="10.5904" x2="16.1281847" y2="7.97405217" id="Stroke-33"></line>' +
                '<line x1="18.375361" y1="10.5904" x2="16.1286054" y2="7.97405217" id="Stroke-35"></line>' +
                '<line x1="8.06419753" y1="15.9743304" x2="24.1925926" y2="15.9743304" id="Stroke-37"></line>' +
                '<line x1="21.5555299" y1="13.7452522" x2="24.1928731" y2="15.9741217" id="Stroke-43"></line>' +
                '<line x1="21.5555299" y1="18.2034087" x2="24.1928731" y2="15.9745391" id="Stroke-45"></line>' +
                '</g>' +
                '<line x1="10.7012602" y1="18.2034087" x2="8.06391704" y2="15.9745391" id="Stroke-39"></line>' +
                '<line x1="10.7012602" y1="13.7452522" x2="8.06391704" y2="15.9741217" id="Stroke-41"></line>' +
                '</g>' +
                '</g>' +
                '</g>' +
                '</svg>' +
                '</button></li>';
        if (-1 < config.uiControls.indexOf('zoom_in'))
            viewer_html +=
                '<li><button type="button" class="fs-button fs-zoomin-button"><span class="tooltip zoomin"></span>' +
                '<svg width="35px" height="36px" viewBox="0 0 35 36" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
                '<g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round">' +
                '<g class="fs-icon" transform="translate(-410.000000, -470.000000)" stroke="#3482D9" stroke-width="2.1">' +
                '<g id="Group-5" transform="translate(411.394568, 472.000000)">' +
                '<path d="M32.2567901,16 C32.2567901,24.8361739 25.0354765,32 16.1283951,32 C7.22061235,32 0,24.8361739 0,16 C0,7.16382609 7.22061235,0 16.1283951,0 C25.0354765,0 32.2567901,7.16382609 32.2567901,16 Z" id="Stroke-15"></path>' +
                '<line x1="9.11604938" y1="16" x2="23.1407407" y2="16" id="Stroke-17"></line>' +
                '<line x1="16.1283951" y1="9.04347826" x2="16.1283951" y2="22.9565217" id="Stroke-19"></line>' +
                '</g>' +
                '</g>' +
                '</g>' +
                '</svg>' +
                '</button></li>';
        if (-1 < config.uiControls.indexOf('zoom_out'))
            viewer_html +=
                '<li><button type="button" class="fs-button fs-zoomout-button"><span class="tooltip zoomout"></span>' +
                '<svg width="36px" height="36px" viewBox="0 0 36 36" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
                '<g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round">' +
                '<g class="fs-icon" transform="translate(-460.000000, -470.000000)" stroke="#3482D9" stroke-width="2.1">' +
                '<g id="Group-4" transform="translate(461.743210, 472.000000)">' +
                '<path d="M32.2567901,16 C32.2567901,24.8361739 25.0361778,32 16.1283951,32 C7.22061235,32 0,24.8361739 0,16 C0,7.16382609 7.22061235,0 16.1283951,0 C25.0361778,0 32.2567901,7.16382609 32.2567901,16 Z" id="Stroke-21"></path>' +
                '<line x1="9.11604938" y1="16" x2="23.1407407" y2="16" id="Stroke-23"></line>' +
                '</g>' +
                '</g>' +
                '</g>' +
                '</svg>' +
                '</button></li>';
        if (-1 < config.uiControls.indexOf('reset'))
            viewer_html +=
                '<li><button type="button" class="fs-button fs-reset-button"><span class="tooltip reset"></span>' +
                '<svg width="36px" height="36px" viewBox="0 0 36 36" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
                '<g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round">' +
                '<g class="fs-icon" transform="translate(2.000000, 2.000000)" stroke="#3482D9" stroke-width="2.1">' +
                '<g id="Group-7">' +
                '<path d="M32,16 C32,24.8361739 24.8361739,32 16,32 C7.16382609,32 0,24.8361739 0,16 C0,7.16382609 7.16382609,0 16,0 C24.8361739,0 32,7.16382609 32,16 Z" id="Stroke-1"></path>' +
                '<path d="M20.2685913,9.56827826 C22.3590261,10.9317565 23.741287,13.2934957 23.741287,15.982887 C23.741287,20.2221913 20.3110261,23.6524522 16.0717217,23.6524522 C11.8324174,23.6524522 8.40215652,20.2221913 8.40215652,15.982887 C8.40215652,13.3053217 9.7725913,10.9526261 11.8470261,9.58636522" id="Stroke-3"></path>' +
                '<line x1="16.0717217" y1="8.34782609" x2="16.0717217" y2="16.3151304" id="Stroke-5"></line>' +
                '</g>' +
                '</g>' +
                '</g>' +
                '</svg>' +
                '</button></li>';

        if ('control' === config.helpButtonPosition) {
            viewer_html +=
                '<li><button type="button" class="fs-button fs-help-button"><span class="tooltip help"></span>' +
                '<svg width="8px" height="21px" viewBox="0 0 8 21" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
                '<defs><polygon id="path-1" points="0 0 8 0 8 21 0 21"></polygon></defs>' +
                '<g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">' +
                '<g transform="translate(-664.000000, -477.000000)">' +
                '<g id="Group-3" transform="translate(664.000000, 477.000000)">' +
                '<mask id="mask-2" fill="white"><use xlink:href="#path-1"></use></mask>' +
                '<g id="Clip-2"></g>' +
                '<path class="fs-icon-fill" d="M3.62109714,4.79882349 C2.02155985,4.79882349 1.09454622,3.90874467 1.09454622,2.37248765 C1.09454622,0.835438742 2.02155985,0 3.62109714,0 C5.2493543,0 6.17557016,0.835438742 6.17557016,2.37248765 C6.17557016,3.90874467 5.2493543,4.79882349 3.62109714,4.79882349 L3.62109714,4.79882349 Z M1.43120693,18.6813605 C1.82450962,18.6275123 1.88035381,18.5467401 1.88035381,18.1428787 L1.88035381,10.2169011 C1.88035381,9.92073608 1.79658752,9.73147555 1.515771,9.65070327 L0,9.13835363 L0.308738619,6.95512651 L6.11972596,6.95512651 L6.11972596,18.1428787 C6.11972596,18.5744561 6.14764806,18.6275123 6.56887284,18.6813605 L8.00007978,18.8706211 L8.00007978,21 L0,21 L0,18.8706211 L1.43120693,18.6813605 Z" id="Fill-1" fill="#3482D9" mask="url(#mask-2)"></path>' +
                '</g>' +
                '</g>' +
                '</g>' +
                '</svg>' +
                '</button></li>';
        }

        viewer_html += '</ul>';

        // Help-Button flex
        if (['left-top', 'left-bottom', 'right-top', 'right-bottom'].indexOf(config.helpButtonPosition) !== -1) {
            let _class = 'fs-button fs-help-button fs-helpflex ' + config.helpButtonPosition;
            viewer_html += '<button type="button" class="' + _class + '">' +
                '<span class="tooltip help"></span>' +
                '<svg width="8px" height="21px" viewBox="0 0 8 21" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
                '<defs><polygon id="path-1" points="0 0 8 0 8 21 0 21"></polygon></defs>' +
                '<g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">' +
                '<g transform="translate(-664.000000, -477.000000)">' +
                '<g id="Group-3" transform="translate(664.000000, 477.000000)">' +
                '<mask id="mask-2" fill="white"><use xlink:href="#path-1"></use></mask>' +
                '<g id="Clip-2"></g>' +
                '<path class="fs-icon-fill" d="M3.62109714,4.79882349 C2.02155985,4.79882349 1.09454622,3.90874467 1.09454622,2.37248765 C1.09454622,0.835438742 2.02155985,0 3.62109714,0 C5.2493543,0 6.17557016,0.835438742 6.17557016,2.37248765 C6.17557016,3.90874467 5.2493543,4.79882349 3.62109714,4.79882349 L3.62109714,4.79882349 Z M1.43120693,18.6813605 C1.82450962,18.6275123 1.88035381,18.5467401 1.88035381,18.1428787 L1.88035381,10.2169011 C1.88035381,9.92073608 1.79658752,9.73147555 1.515771,9.65070327 L0,9.13835363 L0.308738619,6.95512651 L6.11972596,6.95512651 L6.11972596,18.1428787 C6.11972596,18.5744561 6.14764806,18.6275123 6.56887284,18.6813605 L8.00007978,18.8706211 L8.00007978,21 L0,21 L0,18.8706211 L1.43120693,18.6813605 Z" id="Fill-1" fill="#3482D9" mask="url(#mask-2)"></path>' +
                '</g>' +
                '</g>' +
                '</g>' +
                '</svg>' +
                '</button>';
        }

        viewer_html +=
            '<div class="fs-helper"><img src="' + fs360TemplateUrl + 'img/fs-infobox.svg" alt="360&deg;Viewer Anleitung"></div>' +
            createFeaturesHtml(config) +
            '</div>'; // #fsWrapper

        return viewer_html;
    }

    function createFeaturesHtml(config) {
        if (!config || !config.features)
            return '';

        const features = config.features;
        let html       = '';

        if ('width' in features && features.width) {
            html +=
                '<div class="fs-feature fs-width-feature">' +
                `<div>${features.width}</div>` +
                '</div>';
        }

        if ('height' in features && features.height) {
            html +=
                '<div class="fs-feature fs-height-feature">' +
                `<div>${features.height}</div>` +
                '</div>';
        }

        if ('weight' in features && features.weight) {
            html +=
                '<div class="fs-feature fs-weight-feature">' +
                `<div>${features.weight}</div>` +
                '</div>';
        }

        if ('color' in features && features.color) {
            html +=
                '<div class="fs-feature fs-color-feature">' +
                `<div>${features.color}</div>` +
                '</div>';
        }

        if (html) {
            html +=
                '<div class="fs-feature-close">' +
                '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" preserveAspectRatio="xMidYMid meet">' +
                '<g transform="translate(0.000000,64.000000) scale(0.100000,-0.100000)" fill="#434343" stroke="none">' +
                '<path d="M11 476 c2 -3 73 -74 156 -159 l153 -154 155 156 c142 143 152 156 128 159 -22 3 -46 -17 -155 -125 l-128 -128 -128 128 c-104 104 -132 127 -156 127 -16 0 -27 -2 -25 -4z"/> ' +
                '</g>' +
                '</svg>' +
                '</div>';
        }

        return html ? `<div class="fs-features closed">${html}</div>` : '';
    }

    function getConfigName(viewer_name) {
        return viewer_name;
    }

    /**
     * Display debug.
     *
     * Example:
     * displayDebug('Fs360Viewer::init()');
     * displayDebug('Fs360Viewer::loadViewers()', viewer_nl);
     *
     * @param {string} message
     * @param {*} params
     */
    function displayDebug(message = 'DEBUG:', params = null) {
        if (!debug)
            return;

        if (null !== params)
            console.log(message + ' ->', params);
        else
            console.log(message);
    }

    init();

    return self;
}

/**
 * function Fs360Viewer(viewer)
 */
function Fs360Viewer(s){const p=this;for(var e in fs360ViewerDefaults)this[e]=fs360ViewerDefaults[e],void 0!==s.config[e]&&(this[e]=s.config[e]);let t=!1,A="undefined"!=typeof fs360TemplateUrl?fs360TemplateUrl:"template/",M=void 0!==s.detailUrl?s.detailUrl:"",m=null,v=null,N=null,i=[],h=null,a={load:0,count:0,complete:!1},X=0,n=!!parseInt(this.reversePlay),Y=!0,r=0,l=p.aSpeed,c=!1,U=0,W=0;var G=0,u=!1;let g=p.iSize,d=p.iSize*p.maxZoom,y=g*(p.zoomLevel/100),H="fsAnimation-500",R=0,f="",w="";var V,$=0,L=0,B=!1,b=!1;let _=0,K=0,E=(p.viewerImagePosition=n?p.numPix:0,{x:0,y:0,lastX:0,lastY:0,downX:0,downY:0}),S=0,Z=0,I="",j=0,J=0,Q=0,ee=0,x=0,z=0,te=0,oe=0,P=0,q=0;if(p.controlButtons={play:null,rotate:null,shift:null,zoomIn:null,zoomOut:null,reset:null,help:null,fullscreen:null},C("Fs360Viewer::init("+s.name+")"),m=s.element.querySelector(".fs-viewer-wrapper")){if(m.style.width=p.wrapperWidth+"px",m.style.height=p.wrapperHeight+"px",p.debug&&((v=document.createElement("div")).classList.add("fs-viewer-debug"),v.appendChild(document.createTextNode("DEBUG")),m.insertBefore(v,m.firstChild),m.classList.add("debug")),m.classList.add("ui-buttons"),N=m.querySelector(".fs-viewer-image-wrapper"),h=m.querySelector(".fs-viewer-image"),p.controlButtons.play=m.querySelector(".fs-play-button"),p.controlButtons.rotate=m.querySelector(".fs-rotate-button"),p.controlButtons.shift=m.querySelector(".fs-shift-button"),p.controlButtons.zoomIn=m.querySelector(".fs-zoomin-button"),p.controlButtons.zoomOut=m.querySelector(".fs-zoomout-button"),p.controlButtons.reset=m.querySelector(".fs-reset-button"),p.controlButtons.help=m.querySelector(".fs-help-button"),p.controlButtons.fullscreen=m.querySelector(".fs-fullscreen-button"),"isOpened"in p.features&&p.features.isOpened&&We(),"Mac OS"===function(){let e=window.navigator.userAgent,t=window.navigator.platform,o=null;-1!==["Macintosh","MacIntel","MacPPC","Mac68K"].indexOf(t)?o="Mac OS":-1!==["iPhone","iPad","iPod"].indexOf(t)?o="iOS":-1!==["Win32","Win64","Windows","WinCE"].indexOf(t)?o="Windows":/Android/.test(e)?o="Android":!o&&/Linux/.test(t)&&(o="Linux");return o}()&&(p.mSense+=p.macMsenseOffset),-1!==["tablet","mobile"].indexOf(Ge())&&(p.mSense+=X),C("DEBUG Device: "+Ge()),m){var ne='<p onclick="print();">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Drucken...</p><hr><p id="custName">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&copy;&nbsp;360&deg;&nbsp;Animation</p><a href="https://www.fisher-softmedia.de" target="_blank">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Info&nbsp;&uuml;ber&nbsp;euroviewer</a><b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Version '+fs360ViewerVersion+"</b>";let e=document.createElement("div");e.classList.add("fs-contextmenu"),e.style.display="none",e.innerHTML=ne,m.appendChild(e)}t=!0}if(t){window.addEventListener("resize",function(){setTimeout(function(){p.setImageSize(),p.imageToCenter()},100)}),m.addEventListener("mousedown",fe),m.addEventListener("wheel",pe),m.addEventListener("contextmenu",me,!0),m.addEventListener("touchstart",ve),m.addEventListener("touchend",he),p.controlButtons.play&&(p.controlButtons.play.addEventListener("mouseup",ye,!0),p.controlButtons.play.addEventListener("touchstart",ye)),p.controlButtons.rotate&&(p.controlButtons.rotate.addEventListener("mouseup",we),p.controlButtons.rotate.addEventListener("touchstart",we)),p.controlButtons.shift&&(p.controlButtons.shift.addEventListener("mouseup",Le),p.controlButtons.shift.addEventListener("touchstart",Le)),p.controlButtons.zoomIn&&(p.controlButtons.zoomIn.addEventListener("mousedown",Be),p.controlButtons.zoomIn.addEventListener("touchstart",Be)),p.controlButtons.zoomOut&&(p.controlButtons.zoomOut.addEventListener("mousedown",be),p.controlButtons.zoomOut.addEventListener("touchstart",be)),p.controlButtons.reset&&(p.controlButtons.reset.addEventListener("mouseup",Ee),p.controlButtons.reset.addEventListener("touchstart",Ee)),p.controlButtons.help&&(p.controlButtons.help.addEventListener("mousedown",Se),p.controlButtons.help.addEventListener("touchstart",Se)),p.controlButtons.fullscreen&&(p.controlButtons.fullscreen.addEventListener("mouseup",ze),p.controlButtons.fullscreen.addEventListener("touchstart",ze)),m.addEventListener("fullscreenchange",Pe,!0),m.addEventListener("webkitfullscreenchange",Pe,!0);const o=m.querySelector(".fs-feature-close");o&&o.addEventListener("click",Ue),o&&o.addEventListener("touchstart",Ue)}if(t){let e=m.querySelector(".fs-viewer-controls");e&&p.controlImages&&(e.style.display="flex",D())}var se=function(){let e=m.querySelector(".fs-preloader"),t=!1;ie(),s.lightbox||s.studio||!p.startFullScreenDefault||(t=!0);t?(qe(!0),h.style.opacity=1,e.parentNode.removeChild(e),p.rotateOnlyAfter&&(h.style.opacity=G)):setTimeout(function(){h.classList.add("fsAnimation-1000"),h.style.opacity=1,p.rotateOnlyAfter?(l=200,h.style.opacity=G):setTimeout(function(){F(h),e.parentNode.removeChild(e)},1e3)},100);p.rotateOnlyAfter||le();s.lightbox||p.autoplay&&(W=setTimeout(function(){_||re()},1e3))};if(t){a={count:0,load:0,complete:!1};for(let n=0;n<=p.numPix;n++){let e=10<=n?"":"0",t=M+"desktop/"+s.name+p.imagePrefix+e+n+"."+p.imageType;p.savedWebp&&p.showWebp&&(t=M+"desktop/webp/"+s.name+p.imagePrefix+e+n+".webp"),void 0!==p.watermark&&"image"===p.watermark.option&&(V=void 0!==p.watermark.imageType?p.watermark.imageType:"jpg",t=M+"wasserzeichen/"+s.name+p.imagePrefix+e+n+"."+V);let o=new Image;o.src=t,o.style.widht="0px",o.style.height="0px",o.style.visibility="hidden",o.onload=function(){a.load++,a.load===a.count&&(a.complete=!0,"function"==typeof se&&se())},a.count++,i[n]=o,N.appendChild(o)}const He=document.createElement("div");He.classList.add("fs-viewer-front"),N.appendChild(He)}function ie(){p.viewerImagePosition=n?p.numPix:0,p.scaler=p.iSize,w="fsRotate",g=p.iSize,h.src=i[p.viewerImagePosition].src,ke(p.iSize),Fe(0),p.setImageSize(),p.imageToCenter(),D()}function re(){c||(c=!0,w="fsRotate",clearInterval(U),U=setInterval(ae,l))}function T(){return(!p.rotateOnlyAfter||!1!==u)&&(c=!1,Y=!1,clearTimeout(W),clearInterval(U),p.controlButtons.play&&(m.querySelector(".tooltip.play").style.backgroundImage='url("'+A+'img/tooltips/ttStart.png")'),1)}function ae(){p.controlButtons.play&&(p.controlButtons.play.classList.add("active"),m.querySelector(".tooltip.play").style.backgroundImage='url("'+A+'img/tooltips/ttStop.png")');let o=m.querySelector(".fs-preloader"),e=m.querySelector(".fs-preloader-text");if(n?p.viewerImagePosition--:p.viewerImagePosition++,p.viewerImagePosition>p.numPix?(p.viewerImagePosition=0,r++):p.viewerImagePosition<0&&(p.viewerImagePosition=p.numPix,r++),"half_turn"===p.rotateType){let e=parseInt(p.numPix/2)+1,t=!1;p.viewerImagePosition>e?(t=!0,p.viewerImagePosition=e,r++):p.viewerImagePosition<0&&(t=!0,p.viewerImagePosition=0,r++),t&&(T(),p.rotateOnlyAfter&&!1===u&&(u=!0,l=p.aSpeed,h.style.opacity=1,le(),setTimeout(function(){F(h),o.parentNode.removeChild(o)},1e3)))}else p.rotateOnlyAfter&&!1===u&&(u=!0,l=p.aSpeed,h.style.opacity=1,le(),T(),re(),setTimeout(function(){F(h),o.parentNode.removeChild(o)},1e3));Y&&0<p.autoplayRepeat&&r>=p.autoplayRepeat&&T(),p.rotateOnlyAfter&&!1===u&&(e.innerText=parseInt(p.viewerImagePosition/p.numPix*100)+"%"),p.hasOwnProperty("rotateImage")&&1===p.rotateImage?De(n?-1:1):h.src=i[p.viewerImagePosition].src,p.setImageSize()}function le(){let e=m.querySelector(".fs-helper");p.helperShow&&(e.classList.add("show"),p.helperHide&&setTimeout(function(){e.classList.remove("show")},1e4))}function ce(e){e.preventDefault()}function ue(e){E.lastX=E.x,E.lastY=E.y,E.x=e.clientX,E.y=e.clientY}function de(e){window.removeEventListener("dragstart",ce),window.removeEventListener("mousemove",ue),window.removeEventListener("mousemove",Ie),window.removeEventListener("mousemove",xe),window.removeEventListener("mouseup",de),"move"===f&&(m.style.cursor=p.cursors.move),f=""}function fe(o){if(C("Fs360Viewer::onWrapperMouseDown("+o.clientX+", "+o.clientY+")",o.target),E.downX=o.clientX,E.downY=o.clientY,window.addEventListener("dragstart",ce),window.addEventListener("mousemove",ue),window.addEventListener("mouseup",de),ue(o),!o.target.parentNode.classList.contains("fs-contextmenu")){if(o.target.parentNode.classList.contains("fs-helper")||o.target.parentNode.classList.contains("fs-preloader")){let e=m.querySelector(".fs-helper");return e&&e.classList.remove("show"),void(p.controlButtons.help&&p.controlButtons.help.classList.remove("active"))}if(_=Math.floor(Date.now()/1e3),!o.target.closest(".fs-play-button")){if(c){if(!T())return;D()}let e=m.querySelector(".fs-contextmenu");if(e&&(e.style.display="none"),o.target!==p.controlButtons.help){let e=m.querySelector(".fs-helper");e&&e.classList.remove("show"),p.controlButtons.help&&p.controlButtons.help.classList.remove("active")}let t=!1;for(var n of["fs-viewer-image-wrapper","fs-viewer-image","fs-viewer-overlay","fs-viewer-front"])o.target.classList.contains(n)&&(t=!0);t&&("fsRotate"===w?window.addEventListener("mousemove",Ie):"move"===w&&(f="move",m.style.cursor="grab"===p.cursors.move?"grabbing":p.cursors.move,window.addEventListener("mousemove",xe)))}}}function pe(e){if(e.preventDefault(),h&&!(c||f&&"zoom"!==f)){if(e.deltaY<0){if(g+y>d)return g=d,!1;clearTimeout(L),h.addEventListener("transitionend",t),h.classList.add(H),O("INC",y)}else{if(g-y<p.iSize)return g=p.iSize,!1;clearTimeout(L),h.addEventListener("transitionend",t),h.classList.add(H),O("DEC",y)}f="zoom"}function t(){h.removeEventListener("transitionend",t),F(h),f=""}}function me(e){let t=m.querySelector(".fs-contextmenu");t.style.left=e.clientX+"px",t.style.top=e.clientY+"px",t.style.display="block",e.stopPropagation(),e.preventDefault()}function ve(n){n.preventDefault(),C("Fs360Viewer::onWrapperTouchStart("+n.touches[0].pageX+", "+n.touches[0].pageY+")"),te=0,oe=0;for(var e of n.touches)te+=e.pageX,oe+=e.pageY;if(te/=n.touches.length,oe/=n.touches.length,I="",Q=x=te,ee=z=oe,Z=g,S=0,j=0,J=0,!n.target.closest(".fs-play-button")){if(c){if(!T())return;D()}let e=m.querySelector(".fs-contextmenu");if(e&&(e.style.display="none"),n.target!==p.controlButtons.help){let e=m.querySelector(".fs-helper");e&&e.classList.remove("show"),p.controlButtons.help&&p.controlButtons.help.classList.remove("active")}let t=m.querySelector(".fs-helper"),o=(t&&t.classList.remove("show"),!1);for(var s of["fs-viewer-image-wrapper","fs-viewer-image","fs-viewer-front"])n.target.classList.contains(s)&&(o=!0);o&&(D(),window.addEventListener("touchmove",ge))}}function he(e){C("Fs360Viewer::onWrapperTouchEnd()"),window.removeEventListener("touchmove",ge)}function ge(e){var t,o,n,s,i=m.getBoundingClientRect(),r=h.getBoundingClientRect(),a=(I=2<=e.touches.length?"move":w,e);2<=a.touches.length&&(n=a.touches[0].clientX,t=a.touches[0].clientY,o=a.touches[1].clientX,a=a.touches[1].clientY,o=Math.abs(o-n),n=Math.abs(a-t),a=Math.sqrt(o*o+n*n),S=S||a,O("set",Z+=(a-S)/100,!1),I="zoom",v&&(v.innerHTML=`<div>touchAction: ${I}</div>`+`<div>currentSize: ${g}</div>`+`<div>c: ${a}</div>`+`<div>touchDistance: ${S}</div>`+`<div>touchZoome: ${Z}</div>`+`<div>levelSize: ${y}</div>`),S=a),h.classList.remove("fsAnimation"),P=0,q=0;for(s of e.touches)P+=s.pageX,q+=s.pageY;P/=e.touches.length,q/=e.touches.length;e.touches[0].pageX,e.touches[0].pageY;let l=P-x,c=q-z,u="none",d="none",f=r.width/100*p.spacingInPercent;switch(u=P<x?"left":u,u=P>x?"right":u,d=q<z?"top":d,d=q>z?"down":d,I){case"fsRotate":p.controlButtons.rotate&&p.controlButtons.rotate.classList.add("active"),p.hasOwnProperty("rotateImage")&&1===p.rotateImage?De(.25*l*-1):Oe(l);break;case"zoom":case"move":p.controlButtons.shift&&p.controlButtons.shift.classList.add("active"),"left"===u&&r.right-i.left>f&&(h.style.left=parseInt(h.style.left)+l+"px",j+=Math.abs(l)),"right"===u&&i.right-r.left>f&&(h.style.left=parseInt(h.style.left)+l+"px",j+=Math.abs(l)),"top"===d&&r.bottom-i.top>f&&(h.style.top=parseInt(h.style.top)+c+"px",J+=Math.abs(c)),"down"===d&&i.bottom-r.top>f&&(h.style.top=parseInt(h.style.top)+c+"px",J+=Math.abs(c));break;case"zoomIn":case"zoomOut":I=""}x=P,z=q}function ye(e){e.preventDefault(),c?T()&&D():(D(),re()),k(this)}function we(e){e.preventDefault(),T(),D(),p.controlButtons.rotate&&p.controlButtons.rotate.classList.add("active"),w="fsRotate",m.style.cursor="ew-resize",k(this)}function Le(e){e.preventDefault(),T(),D(),p.controlButtons.shift&&p.controlButtons.shift.classList.add("active"),w="move",m.style.cursor=p.cursors.move,k(this)}function Be(e){e.preventDefault(),e.stopPropagation(),h&&(clearTimeout(L),h.addEventListener("transitionend",function e(){h.removeEventListener("transitionend",e);F(h)}),h.classList.add(H),O("inc",y),k(this))}function be(e){e.preventDefault(),h&&(h.addEventListener("transitionend",function e(){h.removeEventListener("transitionend",e);F(h)}),h.classList.add(H),O("dec",y),k(this))}function Ee(e){function t(){h.removeEventListener("transitionstart",t),clearTimeout(L)}function o(){h.removeEventListener("transitionend",o),F(h)}e.preventDefault(),h&&(h.addEventListener("transitionstart",t),h.addEventListener("transitionend",o),h.classList.add("fsAnimation-500"),ie(),L=setTimeout(function(){h.removeEventListener("transitionstart",t),h.removeEventListener("transitionend",o),F(h)},100),k(this))}function Se(e){e.preventDefault(),e.stopPropagation();let t=m.querySelector(".fs-helper");t.classList.contains("show")?(t.classList.remove("show"),p.controlButtons.help&&p.controlButtons.help.classList.remove("active")):(t.classList.add("show"),p.controlButtons.help&&p.controlButtons.help.classList.add("active")),k(this)}function Ie(e){e.stopPropagation(),!h||"rotate"!==f&&f.length||(f="rotate",m.style.cursor="w-resize",p.controlButtons.rotate&&p.controlButtons.rotate.classList.add("active"),e=E.x-E.lastX,p.hasOwnProperty("rotateImage")&&1===p.rotateImage?De(.25*e*-1):Oe(e))}function xe(e){if(h){var i=h.getBoundingClientRect(),r=m.getBoundingClientRect();p.controlButtons.shift&&p.controlButtons.shift.classList.add("active"),h.classList.remove("fsAnimation");let e=E.x-E.lastX,t=E.y-E.lastY,o="none",n="none",s=i.width/100*p.spacingInPercent;o=E.x<E.lastX?"left":o,o=E.x>E.lastX?"right":o,n=E.y<E.lastY?"top":n,n=E.y>E.lastY?"down":n,"left"===o&&i.right-r.left>s&&(h.style.left=parseInt(h.style.left)+e+"px"),"right"===o&&r.right-i.left>s&&(h.style.left=parseInt(h.style.left)+e+"px"),"top"===n&&i.bottom-r.top>s&&(h.style.top=parseInt(h.style.top)+t+"px"),"down"===n&&r.bottom-i.top>s&&(h.style.top=parseInt(h.style.top)+t+"px"),v&&(v.innerHTML=`<div>directionX: ${o}</div>`+`<div>moveX: ${e}</div>`+`<div>directionY: ${n}</div>`+`<div>moveY: ${t}</div>`)}}function ze(e){e.preventDefault(),k(this),qe(!B)}function Pe(e){document.fullscreenElement||document.webkitFullscreenElement||qe(!1)}function qe(e=!1){if(!b)if(F(m),F(h),!0===e){if(!0!==B){if(C("Fs360Viewer::startFullscreen(On)"),b=!0,"wrapper"===p.fullscreenMode&&document.addEventListener("keyup",Te),"document"===p.fullscreenMode){let e=!1;m.requestFullScreen?(m.requestFullScreen(),e=!0):m.webkitRequestFullScreen?(m.webkitRequestFullScreen(),e=!0):m.mozRequestFullScreen?(m.mozRequestFullScreen(),e=!0):m.requestFullscreen&&(m.requestFullscreen(),e=!0),e}m.classList.add("fsAnimation-100"),m.classList.add("fullscreen"),m.style="",m.addEventListener("transitionend",function e(){m.removeEventListener("transitionend",e);F(m);B=!0;b=!1;O();p.setImageSize();p.imageToCenter();setTimeout(function(){h.classList.add("fsAnimation-500"),h.style.opacity=1,p.rotateOnlyAfter&&!u&&(h.style.opacity=G),h.addEventListener("transitionend",t)},100);re()}),h.style.opacity=0,p.controlButtons.fullscreen&&(p.controlButtons.fullscreen.classList.add("fullscreen-off"),p.controlButtons.fullscreen.classList.remove("fullscreen-on"))}function t(){h.removeEventListener("transitionend",t),F(h)}}else{if(!1!==B){if(C("Fs360Viewer::startFullscreen(Off)"),b=!0,"document"===p.fullscreenMode){let e=!1;document.cancelFullScreen?(document.cancelFullScreen(),e=!0):document.webkitCancelFullScreen?(document.webkitCancelFullScreen(),e=!0):document.mozCancelFullScreen?(document.mozCancelFullScreen(),e=!0):document.exitFullscreen&&(document.exitFullscreen(),e=!0),e}m.classList.add("fsAnimation-100"),m.style.width=p.wrapperWidth+"px",m.style.height=p.wrapperHeight+"px",m.addEventListener("transitionend",function e(){m.removeEventListener("transitionend",e);m.classList.remove("fullscreen");F(m);B=!1;b=!1;O();p.setImageSize();p.imageToCenter();setTimeout(function(){h.classList.add("fsAnimation-500"),h.style.opacity=1,h.addEventListener("transitionend",o)},100)}),h.style.opacity="0",p.controlButtons.fullscreen&&(p.controlButtons.fullscreen.classList.add("fullscreen-on"),p.controlButtons.fullscreen.classList.remove("fullscreen-off"))}function o(){h.removeEventListener("transitionend",o),F(h)}}}function Te(e){"Escape"===e.key&&(qe(!1),document.removeEventListener("keyup",Te))}function Oe(e){!h||($+=1)<p.mSense||(($=0)<e?n?p.viewerImagePosition++:p.viewerImagePosition--:e<0&&(n?p.viewerImagePosition--:p.viewerImagePosition++),"half_turn"===p.rotateType?(e=Math.trunc(p.numPix/2),p.viewerImagePosition<0?p.viewerImagePosition=0:p.viewerImagePosition>e&&(p.viewerImagePosition=e+1)):p.viewerImagePosition<0?p.viewerImagePosition=p.numPix:p.viewerImagePosition>p.numPix&&(p.viewerImagePosition=0),h.src=i[p.viewerImagePosition].src)}function O(e="default",t=.5,o=!0){if(!h)return!1;switch(e.toLowerCase()){case"set":g<t?e="inc":g>t&&(e="dec"),g=t;break;case"inc":g+=t;break;case"dec":g-=t;break;default:g=p.iSize}switch((g=g<p.iSize?p.iSize:g)>d&&(g=d),"dec"===e&&(p.setImageSize(),o&&p.imageToCenter()),ke(g),e){case"inc":p.controlButtons.zoomIn&&p.controlButtons.zoomIn.classList.add("active"),p.controlButtons.zoomOut&&p.controlButtons.zoomOut.classList.remove("active");break;case"dec":p.controlButtons.zoomIn&&p.controlButtons.zoomIn.classList.remove("active"),p.controlButtons.zoomOut&&p.controlButtons.zoomOut.classList.add("active")}return clearTimeout(R),R=setTimeout(function(){p.controlButtons.zoomIn&&p.controlButtons.zoomIn.classList.remove("active"),p.controlButtons.zoomOut&&p.controlButtons.zoomOut.classList.remove("active")},500),!0}function ke(e=1){h&&(h.dataset.scale=String(e),Ne(Me()))}function De(e){h&&Fe(parseFloat(void 0!==h.dataset.rotate?h.dataset.rotate:0)+e)}function Fe(e=0){h&&(e=(e=360<e?e%360:e)<0?360+e:e,h.dataset.rotate=e.toFixed(2),Ne(Me()))}function k(e){let t="mobileOn"in p.uiTooltip?parseInt(p.uiTooltip.mobileOn):1,o="mobileHide"in p.uiTooltip?parseFloat(p.uiTooltip.mobileHide):1;isNaN(t)&&(t=1),isNaN(o)&&(t=1),o*=1e3,t&&(Ae(),e.classList.add("hover"),clearTimeout(K),K=setTimeout(Ce,o))}function Ce(){Ae()}function Ae(){s.element.querySelectorAll(".fs-button.hover").forEach(function(e,t){e.classList.remove("hover")})}function Me(e="all"){let t=parseFloat("scale"in h.dataset?h.dataset.scale:1),o=parseFloat("rotate"in h.dataset?h.dataset.rotate:0);return isNaN(t)&&(t=1),isNaN(o)&&(o=0),"scale"===e?t:"rotate"===e?o:`scale(${t}) rotate(${o}deg)`}function Ne(e){h.style.transform=e,h.style.webkitTransform=e,h.style.MozTransform=e,h.style.msTransform=e,h.style.OTransform=e}function Xe(e){return e&&"img"===e.nodeName.toLowerCase()?{width:e.offsetWidth,height:e.offsetHeight,ratio:e.naturalWidth/e.naturalHeight,original:{width:e.naturalWidth,height:e.naturalHeight}}:null}function Ye(e){return e?{width:e.offsetWidth,height:e.offsetHeight,ratio:e.offsetWidth/e.offsetHeight}:null}function D(){C("Fs360Viewer::resetControlButtons()"),p.controlButtons.play&&(p.controlButtons.play.classList.remove("active"),m.querySelector(".tooltip.play").style.backgroundImage='url("'+A+'img/tooltips/ttStart.png")'),p.controlButtons.rotate&&p.controlButtons.rotate.classList.remove("active"),p.controlButtons.shift&&p.controlButtons.shift.classList.remove("active"),p.controlButtons.zoomIn&&p.controlButtons.zoomIn.classList.remove("active"),p.controlButtons.zoomOut&&p.controlButtons.zoomOut.classList.remove("active"),p.controlButtons.reset&&p.controlButtons.reset.classList.remove("active"),p.controlButtons.help&&p.controlButtons.help.classList.remove("active"),m.style.cursor="default"}function Ue(e){const t=m.querySelector(".fs-features");if(t.classList.contains("opened")){const o=m.querySelector(".fs-features"),n=o.querySelectorAll(".fs-feature"),s=o.querySelector(".fs-feature-close");o&&n.length&&(o.classList.remove("opened"),o.classList.add("closed"),n.forEach((e,t)=>{e.style.top=0}),s&&(s.style.top=0))}else We()}function We(){const e=m.querySelector(".fs-features"),t=e.querySelectorAll(".fs-feature"),n=e.querySelector(".fs-feature-close");if(e&&t.length){e.classList.add("opened"),e.classList.remove("closed");let o=0;t.forEach((e,t)=>{e.style.top=o+"px",o+=90}),n&&(n.style.top=o+"px")}}function F(o){if(o){let t=[];for(var e in o.classList){var n;isNaN(e)||(n=o.classList[e],-1!==o.classList[e].indexOf("fsAnimation")&&t.push(n))}for(let e=0;e<t.length;e++)o.classList.remove(t[e])}}function Ge(){var e=navigator.userAgent;return/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(e)?"tablet":/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(e)?"mobile":"desktop"}function C(e="DEBUG:",t=null){p.debug&&(null!==t?console.log(e+" ->",t):console.log(e))}this.setImageSize=function(){var e,t,o,n;a.complete&&(e=Ye(h.parentNode),t=Xe(h),o=p.debug,n="yes"===p.uiButton?50:0,p.debug=!1,h.style.display="block",h.style.position="absolute",1<e.ratio?(C("DEBUG:","wrapper landscape"),1<t.ratio?(C("DEBUG:","image landscape"),h.style.width=e.width+"px",h.style.height="auto"):(t.ratio<1?C("DEBUG:","image portrait"):C("DEBUG:","image square"),h.style.width="auto",h.style.height=e.height-n+"px")):(C("DEBUG:","wrapper portrait"),1<t.ratio?(C("DEBUG:","image landscape"),h.style.width=e.width+"px",h.style.height="auto"):t.ratio<1?(C("DEBUG:","image portrait"),h.style.width="auto",h.style.height=e.height-n+"px"):(C("DEBUG:","image square"),h.style.width=e.width+"px",h.style.height="auto")),p.debug=o)},this.imageToCenter=function(e="both"){var t,o,n,s,i,r;a.complete&&(t=Ye(m),o=Xe(h),s=n=0,i=p.debug,r="yes"===p.uiButton?50:0,p.debug=!1,h.style.display="block",h.style.position="absolute",e&&-1!==["horizontal","vertical","both"].indexOf(e)||(e="both"),s=(1<t.ratio?C("DEBUG:","wrapper landscape"):C("DEBUG:","wrapper portrait"),1<o.ratio?(C("DEBUG:","image landscape"),n=(t.width-h.offsetWidth)/2/*MTG-PATCH: horizontal zentrieren statt left=0 - noetig fuer den Vollbild-Contain-Fix; ergibt 0 bei voller Bildbreite, also im Normalfall identisch*/,(t.height-r-h.offsetHeight)/2):o.ratio<1?(C("DEBUG:","image portrait"),n=(t.width-h.offsetWidth)/2,0):(C("DEBUG:","image square"),n=(t.width-h.offsetWidth)/2,(t.height-r-h.offsetHeight)/2)),n+=p.imgX,s+=p.imgY,"horizontal"===e?h.style.left=n+"px":("vertical"!==e&&(h.style.left=n+"px"),h.style.top=s+"px"),p.debug=i)}}