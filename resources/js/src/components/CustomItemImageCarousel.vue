<template>
    <!-- Wurzel bewusst OHNE v-if: ein v-if auf dem Komponenten-Wurzelelement wird in
         Ceres' Mount-Kontext nicht sauber gerendert -> die Wurzel (und damit unsere
         gesamte .custom-product-gallery-CSS) fehlte. Bedingung daher nach innen. -->
    <div class="custom-product-gallery">
        <template v-if="images && images.length > 0">

        <div class="swiper main-swiper" ref="mainSwiper">
            <div class="swiper-wrapper">

                <div
                    v-for="(slide, index) in slides"
                    :key="slide.key"
                    class="swiper-slide"
                    :class="{ 'fs-360-slide swiper-no-swiping': slide.type === '360' }"
                >
                    <template v-if="slide.type === '360'">
                        <div
                            v-if="currentItemId"
                            :key="'viewer-' + currentItemId + '-' + viewerKey"
                            class="_360grad-viewer"
                            :data-animation="currentItemId"
                        ></div>
                    </template>

                    <img
                        v-else
                        :src="slide.data.url"
                        :alt="slide.data.names.alternate || slide.data.cleanImageName"
                        class="img-fluid"
                        draggable="false"
                        @click="openLightbox(slide.data)"
                    >
                </div>
            </div>
            <div class="swiper-button-prev"></div>
            <div class="swiper-button-next"></div>
        </div>

        <div class="swiper thumbs-swiper mt-2" ref="thumbsSwiper">
            <div class="swiper-wrapper">

                <div
                    v-for="(slide, index) in slides"
                    :key="'thumb-' + slide.key"
                    class="swiper-slide"
                    :class="{ 'thumb-360': slide.type === '360' }"
                >
                    <div v-if="slide.type === '360'" class="thumb-360-icon">
                        <span>360°</span>
                    </div>

                    <img
                        v-else
                        :src="slide.data.urlPreview"
                        :alt="'Vorschau ' + (slide.data.names.alternate || slide.data.cleanImageName)"
                        draggable="false"
                    >
                </div>
            </div>
            
            <div v-if="slides.length > 5" class="swiper-button-prev thumbs-btn-prev"></div>
            <div v-if="slides.length > 5" class="swiper-button-next thumbs-btn-next"></div>
        </div>

        </template>

        <!-- Vollbild-Lightbox. WICHTIG: wird in mounted() nach document.body verschoben,
             sonst wäre sie im z-index:0-Stacking-Context des Karussells gefangen und
             könnte Header/Menü nicht überdecken. -->
        <div
            ref="lightbox"
            class="mtg-lightbox"
            v-show="lightboxOpen"
            @click.self="closeLightbox"
        >
            <div class="mtg-lightbox-stage">
                <img
                    v-if="lightboxImage"
                    :key="lightboxIndex"
                    :src="lightboxImage.url"
                    :alt="lightboxImage.names.alternate || lightboxImage.cleanImageName"
                    draggable="false"
                >
                <button
                    v-if="images.length > 1"
                    type="button"
                    class="mtg-lightbox-prev"
                    aria-label="Vorheriges Bild"
                    @click.stop="lightboxPrev"
                ></button>
                <button
                    v-if="images.length > 1"
                    type="button"
                    class="mtg-lightbox-next"
                    aria-label="Nächstes Bild"
                    @click.stop="lightboxNext"
                ></button>
            </div>

            <div class="mtg-lightbox-bar">
                <span class="mtg-lightbox-counter">Bild {{ lightboxIndex + 1 }} von {{ images.length }}</span>
                <button
                    type="button"
                    class="mtg-lightbox-close"
                    aria-label="Schließen"
                    @click.stop="closeLightbox"
                >&times;</button>
            </div>
        </div>
    </div>
</template>

<script>
import Swiper, { Navigation, Thumbs } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';

export default {
    name: 'CustomItemImageCarousel',
    
    inject: {
        itemId: { default: null }
    },

    data() {
        return {
            mainSwiperInstance: null,
            thumbsSwiperInstance: null,
            has360View: false,
            viewer360Initialized: false, // Viewer erst bei Bedarf (lazy) laden
            viewerKey: 0,
            frames360: 24, // Anzahl der 360°-Frames (24 oder 25, wird erkannt)
            format360: 'webp', // Bildformat der 360°-Frames ('webp' oder 'jpg', wird erkannt)
            resizeObserver360: null,
            lastObservedWidth360: 0,
            lightboxOpen: false,
            lightboxIndex: 0
        }
    },

    computed: {
        currentVariation() {
            return this.itemId 
                ? this.$store.getters[`${this.itemId}/currentItemVariation`] 
                : this.$store.getters.currentItemVariation;
        },
        images() {
            const variationImages = this.currentVariation?.images?.variation || [];
            const allImages = this.currentVariation?.images?.all || [];
            return variationImages.length > 0 ? variationImages : allImages;
        },
        currentItemId() {
             return this.currentVariation?.item?.id || null;
        },
        // Baut die finale Slide-Reihenfolge: reguläre Bilder mit der 360°-Ansicht
        // an 4. Position (Index 3). Hat der Artikel weniger als 3 Bilder, landet
        // die 360°-Ansicht am Ende.
        slides() {
            const list = this.images.map(img => ({ type: 'image', data: img, key: img.imageId }));
            if (this.has360View) {
                const position = Math.min(3, list.length);
                list.splice(position, 0, { type: '360', key: 'fs-360' });
            }
            return list;
        },
        // Index des 360°-Slides in der Liste (-1, wenn keiner vorhanden)
        index360() {
            return this.slides.findIndex(slide => slide.type === '360');
        },
        // Aktuell in der Lightbox gezeigtes Bild (nur reguläre Bilder, kein 360°)
        lightboxImage() {
            return this.images[this.lightboxIndex] || null;
        }
    },

    watch: {
        currentItemId(newId, oldId) {
            if (newId && newId !== oldId) {
                this.has360View = false;
                this.viewer360Initialized = false;
                this.check360Availability(newId);
            }
        },
        images: {
            handler() {
                this.rebuildGallery();
            },
            deep: true
        }
    },

    mounted() {
        // Galerie SOFORT aufbauen - unabhängig vom (externen) 360°-Check,
        // damit das Swiper nicht auf mtgbilder.de warten muss.
        this.rebuildGallery();
        if (this.currentItemId) {
            this.check360Availability(this.currentItemId);
        }

        // Lightbox nach document.body verschieben ("Portal"): sonst steckt sie im
        // z-index:0-Stacking-Context des Karussells fest und kann Header/Menü
        // nicht überdecken. Vue patcht das Element weiterhin ganz normal.
        if (this.$refs.lightbox && this.$refs.lightbox.parentNode !== document.body) {
            document.body.appendChild(this.$refs.lightbox);
        }
        document.addEventListener('keydown', this.onLightboxKey);
    },

    methods: {
        openLightbox(image) {
            // Match über die URL (immer vorhanden & eindeutig) - imageId ist bei
            // manchen Ceres-Bildobjekten undefined, dann fände findIndex immer Bild 0.
            const index = this.images.findIndex(img => img.url === image.url);
            this.lightboxIndex = index >= 0 ? index : 0;
            this.lightboxOpen = true;
            document.body.style.overflow = 'hidden'; // Hintergrund nicht mitscrollen
        },

        closeLightbox() {
            this.lightboxOpen = false;
            document.body.style.overflow = '';
        },

        lightboxPrev() {
            const n = this.images.length;
            if (n > 0) this.lightboxIndex = (this.lightboxIndex - 1 + n) % n;
        },

        lightboxNext() {
            const n = this.images.length;
            if (n > 0) this.lightboxIndex = (this.lightboxIndex + 1) % n;
        },

        onLightboxKey(event) {
            if (!this.lightboxOpen) return;
            if (event.key === 'Escape') this.closeLightbox();
            else if (event.key === 'ArrowLeft') this.lightboxPrev();
            else if (event.key === 'ArrowRight') this.lightboxNext();
        },

        // Prüft CORS-frei, ob eine 360°-Ansicht existiert. Format-Fallback: erst .webp,
        // sonst .jpg (sanfter Übergang während der WebP-Umstellung). Das gefundene
        // Format wird gespeichert (this.format360) und später an den Viewer übergeben.
        // Der Viewer selbst wird erst beim Navigieren zum 360°-Slide geladen.
        check360Availability(id) {
            const baseUrl = window._360g_viewer_url || "";
            if (!baseUrl) return;

            // erst WebP versuchen, bei 404 auf JPG zurückfallen
            this.probe360Format(id, 'webp', () => {
                this.probe360Format(id, 'jpg', () => {
                    // weder .webp noch .jpg -> keine 360°-Ansicht
                });
            });
        },

        // Prüft Frame 00 im angegebenen Format. Existiert es, wird das Format
        // übernommen und die Frame-Anzahl ermittelt; sonst wird onMissing gerufen.
        probe360Format(id, format, onMissing) {
            const baseUrl = window._360g_viewer_url || "";
            const img = new Image();
            img.onload = () => {
                if (id !== this.currentItemId) return; // Variante hat gewechselt
                this.format360 = format;
                this.detect360FrameCount(id, format);
            };
            img.onerror = () => {
                if (id !== this.currentItemId) return;
                onMissing();
            };
            img.src = `${baseUrl}desktop/${id}/00.${format}`;
        },

        // 360°-Sets haben 24 (Index 0..23) oder 25 (Index 0..24) Frames.
        // Existiert Frame 24 (im ermittelten Format), sind es 25 Frames, sonst 24.
        detect360FrameCount(id, format) {
            const baseUrl = window._360g_viewer_url || "";
            const probeFrame24 = new Image();
            probeFrame24.onload = () => {
                if (id !== this.currentItemId) return;
                this.frames360 = 25;
                this.has360View = true;
                this.rebuildGallery(); // 360°-Tile an Position 4 einfügen
            };
            probeFrame24.onerror = () => {
                if (id !== this.currentItemId) return;
                this.frames360 = 24;
                this.has360View = true;
                this.rebuildGallery();
            };
            probeFrame24.src = `${baseUrl}desktop/${id}/24.${format}`;
        },

        rebuildGallery() {
            this.teardown360ResizeObserver();
            this.viewer360Initialized = false; // Viewer-Div wird neu erzeugt -> erneut lazy laden

            if (this.mainSwiperInstance) {
                this.mainSwiperInstance.destroy(true, true);
                this.mainSwiperInstance = null;
            }
            if (this.thumbsSwiperInstance) {
                this.thumbsSwiperInstance.destroy(true, true);
                this.thumbsSwiperInstance = null;
            }

            // viewerKey zwingt Vue dazu, den 360°-Viewer-div neu zu erzeugen
            this.viewerKey++;

            this.$nextTick(() => {
                this.initGallery();
            });
        },

        initGallery() {
            if (!this.$refs.thumbsSwiper || !this.$refs.mainSwiper) return;

            this.thumbsSwiperInstance = new Swiper(this.$refs.thumbsSwiper, {
                modules: [Navigation], 
                spaceBetween: 10,
                slidesPerView: 5,
                freeMode: true,
                watchSlidesProgress: true,
                slideToClickedSlide: true, 
                observer: true,
                observeParents: true,
                navigation: {
                    nextEl: this.$refs.thumbsSwiper.querySelector('.thumbs-btn-next'),
                    prevEl: this.$refs.thumbsSwiper.querySelector('.thumbs-btn-prev'),
                }
            });

            this.mainSwiperInstance = new Swiper(this.$refs.mainSwiper, {
                modules: [Navigation, Thumbs], 
                spaceBetween: 10,
                loop: false, 
                observer: true,
                observeParents: true,
                navigation: {
                    nextEl: this.$refs.mainSwiper.querySelector('.swiper-button-next'),
                    prevEl: this.$refs.mainSwiper.querySelector('.swiper-button-prev'),
                },
                thumbs: {
                    swiper: this.thumbsSwiperInstance
                },
                on: {
                    // 360°-Viewer LAZY laden: erst wenn der User den 360°-Slide erreicht
                    // (per Wisch oder Klick aufs 360°-Thumbnail).
                    slideChange: (swiper) => {
                        if (this.has360View && !this.viewer360Initialized && swiper.activeIndex === this.index360) {
                            this.init360Viewer();
                        }
                    }
                }
            });
        },

        init360Viewer() {
            this.viewer360Initialized = true; // verhindert erneute Initialisierung
            // $nextTick stellt sicher, dass der ._360grad-viewer-div im DOM ist,
            // danach braucht der Fisher-Viewer etwas Zeit zum Messen des Containers.
            this.$nextTick(() => {
                setTimeout(() => {
                    if (!this.currentItemId) return;

                    window.fs360ViewerConfigs = window.fs360ViewerConfigs || {};

                    const fisherDefaults = window.fs360ViewerDefaults || {
                        uiControls: ['play', 'rotate', 'shift', 'zoom_in', 'zoom_out', 'reset'],
                        helpButtonPosition: 'control',
                        imageType: 'jpg',
                        imagePrefix: '_'
                    };

                    window.fs360ViewerConfigs[this.currentItemId] = Object.assign({}, fisherDefaults, {
                        numPix: this.frames360 - 1,
                        autoplay: 0,
                        fullscreenMode: 'document',
                        imagePrefix: '/',            // Pfad: desktop/{id}/{frame}...
                        imageType: this.format360    // ...{frame}.webp oder .jpg (erkannt)
                    });

                    if (typeof window.Fs360ViewerLoader === "function") {
                        window.fs360ViewerLoader = new window.Fs360ViewerLoader();
                    }

                    // Fisher misst die Bildgröße EINMALIG, sobald alle Frames geladen sind.
                    // Da die Frames durch den 360°-Existenz-Check schon im Cache liegen, ist
                    // er oft fertig BEVOR Swiper dem Slide seine endgültige Breite gegeben hat
                    // -> das Bild wird auf width:0 berechnet und bleibt unsichtbar.
                    // centerViewers() löst eine Neuvermessung aus, sobald das Layout steht.
                    this.setup360ResizeObserver();
                }, 200);
            });
        },

        // Löst eine Neuvermessung des Fisher-Viewers aus (Bildgröße neu berechnen).
        recenter360() {
            if (this.mainSwiperInstance) this.mainSwiperInstance.update();
            if (this.thumbsSwiperInstance) this.thumbsSwiperInstance.update();
            if (window.fs360ViewerLoader && typeof window.fs360ViewerLoader.centerViewers === "function") {
                window.fs360ViewerLoader.centerViewers();
            }
        },

        setup360ResizeObserver() {
            this.teardown360ResizeObserver();

            const el = this.$refs.mainSwiper;
            if (!el) return;

            // Fallback für sehr alte Browser ohne ResizeObserver
            if (typeof ResizeObserver === "undefined") {
                setTimeout(() => this.recenter360(), 300);
                setTimeout(() => this.recenter360(), 800);
                return;
            }

            this.lastObservedWidth360 = 0;
            this.resizeObserver360 = new ResizeObserver(() => {
                const width = el.offsetWidth;
                // Nur reagieren, wenn der Container eine NEUE, sinnvolle Breite hat.
                if (width > 0 && width !== this.lastObservedWidth360) {
                    this.lastObservedWidth360 = width;
                    this.recenter360();
                }
            });
            // observe() feuert sofort mit der aktuellen Größe: sitzt sie schon, wird
            // direkt neu vermessen; ist sie noch 0, warten wir aufs erste echte Layout.
            this.resizeObserver360.observe(el);
        },

        teardown360ResizeObserver() {
            if (this.resizeObserver360) {
                this.resizeObserver360.disconnect();
                this.resizeObserver360 = null;
            }
        }
    },

    beforeDestroy() {
        this.teardown360ResizeObserver();
        document.removeEventListener('keydown', this.onLightboxKey);
        document.body.style.overflow = '';
        // Lightbox wurde nach document.body verschoben -> selbst aufräumen
        const lb = this.$refs.lightbox;
        if (lb && lb.parentNode === document.body) {
            document.body.removeChild(lb);
        }
    }
}
</script>

<style scoped>
.main-swiper { width: 100%; aspect-ratio: 1 / 1; border: 1px solid #e9ecef; background-color: #ffffff; position: relative; overflow: hidden; }
.main-swiper .swiper-slide { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
.main-swiper img { width: 100%; height: 100%; object-fit: contain; }
/* Nur reguläre Bilder sind klickbar (Lightbox) - der 360°-Slide behält seinen Cursor */
.main-swiper .swiper-slide:not(.fs-360-slide) img { cursor: zoom-in; }
.main-swiper .swiper-button-next, .main-swiper .swiper-button-prev { z-index: 200 !important; }

.thumbs-swiper { width: 100%; padding: 10px 30px; position: relative; }
.thumbs-swiper .swiper-slide { opacity: 1; border: 1px solid #e9ecef; cursor: pointer; aspect-ratio: 1 / 1; display: flex; justify-content: center; align-items: center; background-color: #fff; }
.thumbs-swiper .swiper-slide-thumb-active { opacity: 1; border-color: #888888; }
.thumbs-swiper img { width: 100%; height: 100%; object-fit: contain; }

.thumbs-btn-prev { left: 0 !important; }
.thumbs-btn-next { right: 0 !important; }

.thumb-360-icon, .loading-placeholder { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; background-color: #f8f9fa; color: #3482d9; font-weight: bold; font-size: 1.2rem; }
.fs-360-slide { position: relative; width: 100% !important; height: 100% !important; min-height: 300px; }
/* Der Viewer-Div hat absolut positionierten Inhalt und damit keine Eigengröße.
   Im Flex-zentrierten Slide würde er sonst auf 0x0 kollabieren -> explizit füllen. */
.fs-360-slide ._360grad-viewer { width: 100% !important; height: 100% !important; }

::v-deep .fs-viewer-wrapper { width: 100% !important; height: 100% !important; max-width: 100% !important; max-height: 100% !important; }
::v-deep .fs-helper { z-index: 9999 !important; }
</style>

<!--
    Swiper-Grundlayout bewusst NICHT-scoped und direkt in der Komponente.
    Grund: 'import "swiper/css"' wird im laravel-mix Production-Build (--production)
    nicht zuverlässig zur Laufzeit injiziert. Ohne diese Regeln ist .swiper-wrapper
    kein Flex-Container -> Slides stapeln vertikal und nur das erste Bild ist sichtbar.
-->
<style>
/* WICHTIG: Ceres entfernt beim Mount das Wurzel-<div class="custom-product-gallery">
   und behält stattdessen das <custom-item-image-carousel>-Tag als Hülle. Deshalb sind
   ALLE Regeln aufs Tag geprägt (custom-item-image-carousel …) statt auf .custom-product-gallery. */
custom-item-image-carousel {
    display: flex;
    flex-direction: column;
    width: 100%;
    /* Eigener, niedriger Stacking-Context: kapselt die internen z-indexe (Swiper,
       Pfeile) ein, damit das Karussell NICHT über dem Site-Menü landet. */
    position: relative;
    z-index: 0;
    /* Verhindert das blaue Auswahl-Markieren beim schnellen Klicken/Wischen */
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    -webkit-tap-highlight-color: transparent;
}
custom-item-image-carousel img {
    -webkit-user-drag: none;
    user-drag: none;
    user-select: none;
    -webkit-user-select: none;
}
custom-item-image-carousel .swiper {
    margin-left: auto;
    margin-right: auto;
    position: relative;
    overflow: hidden;
    list-style: none;
    padding: 0;
    z-index: 1;
    display: block;
}
custom-item-image-carousel .swiper-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    z-index: 1;
    display: flex;
    box-sizing: content-box;
    transition-property: transform;
}
custom-item-image-carousel .swiper-slide {
    flex-shrink: 0;
    width: 100%;
    height: 100%;
    position: relative;
    transition-property: transform;
}
/* ---- Navigation: gemeinsame Basis (Haupt- + Thumbnail-Pfeile) ----
   Heller, halbtransparenter Kasten mit dunklem Chevron (per CSS-Border). */
custom-item-image-carousel .swiper-button-prev,
custom-item-image-carousel .swiper-button-next {
    position: absolute;
    top: 50%;
    z-index: 10;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.75);
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
custom-item-image-carousel .swiper-button-prev:hover,
custom-item-image-carousel .swiper-button-next:hover { background: rgba(255, 255, 255, 0.95); }
custom-item-image-carousel .swiper-button-disabled { opacity: 0.35; pointer-events: none; }

custom-item-image-carousel .swiper-button-prev::after,
custom-item-image-carousel .swiper-button-next::after {
    content: '';
    display: block;
    width: 20px;
    height: 20px;
    border: solid #444444;       /* Farbe des Chevrons */
    border-width: 0 6px 6px 0;   /* Dicke des Chevrons */
}
custom-item-image-carousel .swiper-button-next::after { transform: rotate(-45deg); position: relative; left: -2px; }
custom-item-image-carousel .swiper-button-prev::after { transform: rotate(135deg); position: relative; left: 2px; }

/* HAUPT-Pfeile: größere Box */
custom-item-image-carousel .main-swiper .swiper-button-prev,
custom-item-image-carousel .main-swiper .swiper-button-next { width: 46px; height: 46px; margin-top: -23px; }
custom-item-image-carousel .main-swiper .swiper-button-prev { left: 0; border-radius: 0 6px 6px 0; }
custom-item-image-carousel .main-swiper .swiper-button-next { right: 0; border-radius: 6px 0 0 6px; }

/* THUMBNAIL-Pfeile: kleinere Box + dünnerer Chevron */
custom-item-image-carousel .thumbs-swiper .swiper-button-prev,
custom-item-image-carousel .thumbs-swiper .swiper-button-next { width: 32px; height: 32px; margin-top: -16px; }
custom-item-image-carousel .thumbs-swiper .swiper-button-prev::after,
custom-item-image-carousel .thumbs-swiper .swiper-button-next::after { width: 13px; height: 13px; border-width: 0 4px 4px 0; }

/* ---- 360°-Viewer-Icons in Grau (überschreibt das Blau/Grün aus viewercore_mi.js) ----
   .fs-icon = Kontur (stroke), .fs-icon-fill = Fläche (fill). Höhere Spezifität
   durch den .custom-product-gallery-Präfix, daher kein !important nötig. */
custom-item-image-carousel .fs-button svg .fs-icon { stroke: #888888; }
custom-item-image-carousel .fs-button svg .fs-icon-fill { fill: #888888; }
custom-item-image-carousel .fs-button.active svg .fs-icon { stroke: #555555; }
custom-item-image-carousel .fs-button.active svg .fs-icon-fill { fill: #555555; }
custom-item-image-carousel .fs-fullscreen-button:hover svg .fs-icon { stroke: #555555; }

/* ---- 360°-Viewer im Vollbild: Bild komplett einpassen (contain) ----
   Fishers setImageSize skaliert Querformat-Frames auf die volle Breite. Im
   Landscape-Vollbild wird das Bild dadurch zu hoch und oben/unten beschnitten.
   Wir begrenzen die BASIS-Größe per CSS (nur im .fullscreen-Zustand). Der Zoom
   läuft über CSS-transform und wird davon NICHT eingeschränkt.
   Bewusst ohne Tag-Präfix: .fs-viewer-wrapper.fullscreen ist eindeutig genug. */
.fs-viewer-wrapper.fullscreen .fs-viewer-image {
    width: auto !important;
    height: auto !important;
    max-width: 100% !important;
    max-height: calc(100% - 60px) !important; /* 60px Platz für die Bedienleiste unten */
}

/* ---- Vollbild-Lightbox ----
   Liegt per Portal direkt im <body> (NICHT im custom-item-image-carousel-Tag),
   deshalb hier bewusst OHNE Tag-Präfix. Hoher z-index, damit sie Header/Menü
   überdeckt - das geht nur, weil sie außerhalb des z-index:0-Contexts sitzt. */
.mtg-lightbox {
    position: fixed;
    top: 0; right: 0; bottom: 0; left: 0;
    z-index: 99999;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    box-sizing: border-box;
    user-select: none;
    -webkit-user-select: none;
}
.mtg-lightbox-stage {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 1000px;
    background: #ffffff;
    padding: 20px;
    box-sizing: border-box;
}
.mtg-lightbox-stage img {
    display: block;
    max-width: 100%;
    max-height: 75vh;
    object-fit: contain;
    -webkit-user-drag: none;
    user-drag: none;
}

/* Pfeile: gleicher Stil wie im Karussell */
.mtg-lightbox-prev,
.mtg-lightbox-next {
    position: absolute;
    top: 50%;
    margin-top: -23px;
    width: 46px;
    height: 46px;
    padding: 0;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.75);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
.mtg-lightbox-prev { left: 0; border-radius: 0 6px 6px 0; }
.mtg-lightbox-next { right: 0; border-radius: 6px 0 0 6px; }
.mtg-lightbox-prev:hover,
.mtg-lightbox-next:hover { background: rgba(255, 255, 255, 0.95); }
.mtg-lightbox-prev::after,
.mtg-lightbox-next::after {
    content: '';
    display: block;
    width: 20px;
    height: 20px;
    border: solid #444444;
    border-width: 0 6px 6px 0;
}
.mtg-lightbox-next::after { transform: rotate(-45deg); position: relative; left: -2px; }
.mtg-lightbox-prev::after { transform: rotate(135deg); position: relative; left: 2px; }

/* Leiste unter dem Bild: Zähler links, Schließen rechts */
.mtg-lightbox-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 1000px;
    margin-top: 14px;
    color: #ffffff;
}
.mtg-lightbox-counter { font-size: 0.95rem; }
.mtg-lightbox-close {
    background: none;
    border: none;
    color: #ffffff;
    font-size: 2.2rem;
    line-height: 1;
    padding: 0 6px;
    cursor: pointer;
}
.mtg-lightbox-close:hover { color: #cccccc; }
</style>