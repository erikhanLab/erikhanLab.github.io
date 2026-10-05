document.addEventListener("DOMContentLoaded", () => {
            const lightbox =
                document.getElementById("research-lightbox");

            const lightboxMedia =
                lightbox?.querySelector(".research-lightbox-media");

            const lightboxTitle =
                lightbox?.querySelector(".research-lightbox-title");

            const lightboxMeta =
                lightbox?.querySelector(".research-lightbox-meta");

            const closeButton =
                lightbox?.querySelector(".research-lightbox-close");

            const triggers =
                document.querySelectorAll(".research-visual-open");

            if (
                !lightbox ||
                !lightboxMedia ||
                !lightboxTitle ||
                !lightboxMeta ||
                !closeButton
            ) {
                console.error(
                    "Research lightbox elements were not found."
                );

                return;
            }

            let activeTrigger = null;
            let activeMedia = null;
            let activeVideoHadControls = false;

            let originalParent = null;
            let originalNextElement = null;

            let closeTimer = null;

            function restoreMedia() {
                if (
                    !activeMedia ||
                    !originalParent
                ) {
                    return;
                }

                if (
                    originalNextElement &&
                    originalNextElement.parentElement === originalParent
                ) {
                    originalParent.insertBefore(
                        activeMedia,
                        originalNextElement
                    );
                } else {
                    originalParent.appendChild(
                        activeMedia
                    );
                }

                if (activeMedia instanceof HTMLVideoElement) {
                    activeMedia.pause();
                    activeMedia.controls = activeVideoHadControls;
                }

                activeMedia = null;
                activeVideoHadControls = false;
                originalParent = null;
                originalNextElement = null;
            }

            function openLightbox(trigger) {
                clearTimeout(closeTimer);

                if (
                    lightbox.classList.contains("is-open")
                ) {
                    return;
                }

                const sourceMedia =
                    trigger.querySelector("img, video");

                const card =
                    trigger.closest(".research-visual-card");

                if (!sourceMedia || !card) return;

                const name =
                    card.querySelector(".research-visual-name");

                const meta =
                    card.querySelector(".research-visual-meta");

                activeTrigger = trigger;
                activeMedia = sourceMedia;

                if (sourceMedia instanceof HTMLVideoElement) {
                    activeVideoHadControls = sourceMedia.controls;
                }

                originalParent =
                    sourceMedia.parentElement;

                originalNextElement =
                    sourceMedia.nextElementSibling;

                lightboxMedia.appendChild(
                    sourceMedia
                );

                if (sourceMedia instanceof HTMLVideoElement) {
                    const reduceMotion = window.matchMedia(
                        "(prefers-reduced-motion: reduce)"
                    ).matches;

                    if (reduceMotion) {
                        sourceMedia.controls = true;
                    } else {
                        sourceMedia.play().catch(() => {});
                    }
                }

                lightboxTitle.textContent =
                    name?.textContent.trim() || "";

                lightboxMeta.textContent =
                    meta?.textContent.trim() || "";

                lightbox.setAttribute(
                    "aria-hidden",
                    "false"
                );

                requestAnimationFrame(() => {
                    lightbox.classList.add("is-open");
                });

                closeButton.focus({
                    preventScroll: true
                });
            }

            function closeLightbox() {
                if (
                    !lightbox.classList.contains("is-open")
                ) {
                    return;
                }

                lightbox.classList.remove("is-open");

                lightbox.setAttribute(
                    "aria-hidden",
                    "true"
                );

                clearTimeout(closeTimer);

                closeTimer = window.setTimeout(() => {
                    restoreMedia();

                    activeTrigger?.focus({
                        preventScroll: true
                    });

                    activeTrigger = null;
                }, 180);
            }

            triggers.forEach(trigger => {
                trigger.addEventListener("click", () => {
                    openLightbox(trigger);
                });
            });

            lightboxMedia.addEventListener(
                "click",
                event => {
                    if (event.target === activeMedia) {
                        closeLightbox();
                    }
                }
            );

            closeButton.addEventListener(
                "click",
                closeLightbox
            );

            lightbox.addEventListener(
                "click",
                event => {
                    if (event.target === lightbox) {
                        closeLightbox();
                    }
                }
            );

            /*
             * body overflow를 바꾸지 않고
             * overlay 위의 스크롤 입력만 차단한다.
             * 페이지 폭이 변하지 않아 ResizeObserver도 자극하지 않는다.
             */
            lightbox.addEventListener(
                "wheel",
                event => {
                    if (
                        lightbox.classList.contains("is-open")
                    ) {
                        event.preventDefault();
                    }
                },
                {
                    passive: false
                }
            );

            lightbox.addEventListener(
                "touchmove",
                event => {
                    if (
                        lightbox.classList.contains("is-open")
                    ) {
                        event.preventDefault();
                    }
                },
                {
                    passive: false
                }
            );

            document.addEventListener(
                "keydown",
                event => {
                    if (
                        event.key === "Escape" &&
                        lightbox.classList.contains("is-open")
                    ) {
                        closeLightbox();
                    }
                }
            );
        });
    

        const DEFAULT_LANG = "en";
        const SUPPORTED_LANGS = new Set(["en", "ja"]);

        let scrollUpdateScheduled = false;
        let archiveLayoutObserver = null;
        let smoothScrollFrame = null;

        function getSessionLang() {
            const saved = sessionStorage.getItem("lang");

            return SUPPORTED_LANGS.has(saved)
                ? saved
                : DEFAULT_LANG;
        }

        function applyLang(lang) {
            const safeLang = SUPPORTED_LANGS.has(lang)
                ? lang
                : DEFAULT_LANG;

            document.documentElement.setAttribute(
                "lang",
                safeLang
            );

            document.documentElement.setAttribute(
                "data-lang",
                safeLang
            );

            document.querySelectorAll("[data-en]").forEach(element => {
                const value = element.getAttribute(
                    `data-${safeLang}`
                );

                if (value !== null) {
                    element.innerHTML = value;
                }
            });

            document.querySelectorAll(".lang-switch a").forEach(link => {
                link.classList.toggle(
                    "active",
                    link.dataset.lang === safeLang
                );
            });
        }

        function clamp(value, minimum, maximum) {
            return Math.min(
                Math.max(value, minimum),
                maximum
            );
        }

        function easeInOutQuint(progress) {
            return progress < 0.5
                ? 16 * Math.pow(progress, 5)
                : 1 - Math.pow(-2 * progress + 2, 5) / 2;
        }

        function cancelSmoothScroll() {
            if (smoothScrollFrame !== null) {
                cancelAnimationFrame(smoothScrollFrame);
                smoothScrollFrame = null;
            }
        }

        function smoothScrollTo(targetY) {
            cancelSmoothScroll();

            const scrollingElement =
                document.scrollingElement ||
                document.documentElement;

            const maximumScrollY = Math.max(
                0,
                scrollingElement.scrollHeight -
                window.innerHeight
            );

            const startY =
                window.scrollY;

            const destinationY = clamp(
                targetY,
                0,
                maximumScrollY
            );

            const distance =
                destinationY - startY;

            if (Math.abs(distance) < 1) {
                window.scrollTo(0, destinationY);
                return;
            }

            const reduceMotion =
                window.matchMedia(
                    "(prefers-reduced-motion: reduce)"
                ).matches;

            if (reduceMotion) {
                window.scrollTo(0, destinationY);
                return;
            }

            const duration = clamp(
                420 + Math.abs(distance) * 0.16,
                480,
                1050
            );

            const startTime =
                performance.now();

            function animate(currentTime) {
                const elapsed =
                    currentTime - startTime;

                const progress = clamp(
                    elapsed / duration,
                    0,
                    1
                );

                const easedProgress =
                    easeInOutQuint(progress);

                window.scrollTo(
                    0,
                    startY + distance * easedProgress
                );

                if (progress < 1) {
                    smoothScrollFrame =
                        requestAnimationFrame(animate);
                } else {
                    window.scrollTo(
                        0,
                        destinationY
                    );

                    smoothScrollFrame = null;
                }
            }

            smoothScrollFrame =
                requestAnimationFrame(animate);
        }

        function getDocumentTop(element) {
            return (
                element.getBoundingClientRect().top +
                window.scrollY
            );
        }

        function getArchiveSectionDefinitions() {
            const sideNav =
                document.querySelector(".archive-side-nav");

            if (!sideNav) return [];

            const definitions = [
                {
                    key: "curated",
                    selector: "#section-curated"
                },
                {
                    key: "visual-record",
                    selector: "#section-visual-record"
                },
                {
                    key: "visual-work",
                    selector: "#section-visual-work"
                },
                {
                    key: "chronology",
                    selector: "#section-timeline"
                },
                {
                    key: "records",
                    selector: "#section-records"
                },
                {
                    key: "external",
                    selector: "#section-external"
                }
            ];

            return definitions
                .map(definition => {
                    const currentLink =
                        sideNav.querySelector(
                            `a[href="${definition.selector}"]`
                        );

                    return {
                        ...definition,

                        target:
                            document.querySelector(
                                definition.selector
                            ),

                        currentLink,

                        activeLinks:
                            currentLink
                                ? [currentLink]
                                : []
                    };
                })
                .filter(definition =>
                    definition.target &&
                    definition.currentLink
                );
        }

        function buildArchiveScrollMap() {
            const definitions =
                getArchiveSectionDefinitions();

            if (!definitions.length) {
                archiveScrollMap = [];
                archiveScrollMax = 0;
                return;
            }

            const scrollingElement =
                document.scrollingElement ||
                document.documentElement;

            archiveScrollMax = Math.max(
                0,
                scrollingElement.scrollHeight -
                window.innerHeight
            );

            const firstSection =
                definitions[0].target;

            const lastSection =
                definitions.at(-1).target;

            const contentStart =
                getDocumentTop(firstSection);

            const contentEnd = Math.max(
                contentStart + 1,

                getDocumentTop(lastSection) +
                lastSection.offsetHeight
            );

            const contentHeight =
                contentEnd - contentStart;

            archiveScrollMap = definitions.map(
                (definition, index) => {
                    const sectionTop =
                        getDocumentTop(definition.target);

                    const nextSectionTop =
                        index < definitions.length - 1
                            ? getDocumentTop(
                                definitions[index + 1].target
                            )
                            : contentEnd;

                    const startRatio = clamp(
                        (
                            sectionTop -
                            contentStart
                        ) / contentHeight,
                        0,
                        1
                    );

                    const endRatio = clamp(
                        (
                            nextSectionTop -
                            contentStart
                        ) / contentHeight,
                        0,
                        1
                    );

                    return {
                        ...definition,

                        sectionTop,
                        sectionBottom: nextSectionTop,

                        startScroll:
                            startRatio * archiveScrollMax,

                        endScroll:
                            index === definitions.length - 1
                                ? archiveScrollMax
                                : endRatio * archiveScrollMax
                    };
                }
            );
        }

        function updateArchiveSideNavigation() {
            const sideNav =
                document.querySelector(".archive-side-nav");

            if (!sideNav) return;

            if (
                archiveMapDirty ||
                !archiveScrollMap.length
            ) {
                buildArchiveScrollMap();
                archiveMapDirty = false;
            }

            if (!archiveScrollMap.length) return;

            const currentScroll = clamp(
                window.scrollY,
                0,
                archiveScrollMax
            );

            let activeSection =
                archiveScrollMap[0];

            for (const section of archiveScrollMap) {
                if (
                    currentScroll + 0.5 >=
                    section.startScroll
                ) {
                    activeSection = section;
                } else {
                    break;
                }
            }

            sideNav
                .querySelectorAll('a[href^="#"]')
                .forEach(link => {
                    link.classList.remove("active");
                    link.removeAttribute("aria-current");
                });

            activeSection.activeLinks.forEach(link => {
                link.classList.add("active");
            });

            activeSection.currentLink.setAttribute(
                "aria-current",
                "location"
            );
        }

        function updateNavigationState() {
            const nav =
                document.querySelector(".nav");

            if (!nav) return;

            nav.classList.toggle(
                "is-scrolled",
                window.scrollY > 24
            );
        }

        function schedulePageUpdate(
            rebuildMap = false
        ) {
            if (rebuildMap) {
                archiveMapDirty = true;
            }

            if (scrollUpdateScheduled) return;

            scrollUpdateScheduled = true;

            requestAnimationFrame(() => {
                if (archiveMapDirty) {
                    buildArchiveScrollMap();
                    archiveMapDirty = false;
                }

                updateNavigationState();
                updateArchiveSideNavigation();

                scrollUpdateScheduled = false;
            });
        }

        function bindArchiveSideNavigation() {
            const sideNav =
                document.querySelector(".archive-side-nav");

            if (!sideNav) return;

            sideNav.addEventListener("click", event => {
                const link =
                    event.target.closest('a[href^="#"]');

                if (
                    !link ||
                    !sideNav.contains(link)
                ) {
                    return;
                }

                if (
                    archiveMapDirty ||
                    !archiveScrollMap.length
                ) {
                    buildArchiveScrollMap();
                    archiveMapDirty = false;
                }

                const selector =
                    link.getAttribute("href");

                const mappedSection =
                    archiveScrollMap.find(
                        section =>
                            section.selector === selector
                    );

                if (!mappedSection) return;

                event.preventDefault();

                history.replaceState(
                    null,
                    "",
                    selector
                );

                smoothScrollTo(
                    Math.min(
                        archiveScrollMax,
                        mappedSection.startScroll + 1
                    )
                );
            });
        }

        function observeArchiveLayout() {
            const pageContent =
                document.querySelector(".page-content");

            if (
                !pageContent ||
                !("ResizeObserver" in window)
            ) {
                return;
            }

            archiveLayoutObserver =
                new ResizeObserver(() => {
                    schedulePageUpdate(true);
                });

            archiveLayoutObserver.observe(
                pageContent
            );
        }

        window.addEventListener(
            "scroll",
            () => {
                schedulePageUpdate(false);
            },
            {
                passive: true
            }
        );

        window.addEventListener(
            "resize",
            () => {
                schedulePageUpdate(true);
            },
            {
                passive: true
            }
        );

        window.addEventListener(
            "load",
            () => {
                document
                    .querySelector(".page-content")
                    ?.classList.add("loaded");

                schedulePageUpdate(true);
            }
        );

        document.addEventListener(
            "DOMContentLoaded",
            () => {
                applyLang(getSessionLang());

                bindArchiveSideNavigation();
                observeArchiveLayout();

                document
                    .querySelectorAll(".lang-switch a")
                    .forEach(link => {
                        link.addEventListener(
                            "click",
                            event => {
                                event.preventDefault();

                                const selected =
                                    SUPPORTED_LANGS.has(
                                        link.dataset.lang
                                    )
                                        ? link.dataset.lang
                                        : DEFAULT_LANG;

                                sessionStorage.setItem(
                                    "lang",
                                    selected
                                );

                                applyLang(selected);

                                schedulePageUpdate(true);
                            }
                        );
                    });

                schedulePageUpdate(true);
            }
        );
    

        function initialiseResearchVisuals() {
            const section =
                document.querySelector(".research-visuals");

            const windowElement =
                section?.querySelector(".research-visuals-window");

            const viewport =
                section?.querySelector(".research-visuals-viewport");

            const track =
                section?.querySelector(".research-visuals-track");

            const previousButton =
                section?.querySelector(".research-visuals-prev");

            const nextButton =
                section?.querySelector(".research-visuals-next");

            if (
                !section ||
                !windowElement ||
                !viewport ||
                !track ||
                !previousButton ||
                !nextButton
            ) {
                return;
            }

            const reduceMotion =
                window.matchMedia(
                    "(prefers-reduced-motion: reduce)"
                ).matches;

            const canHover =
                window.matchMedia(
                    "(hover: hover) and (pointer: fine)"
                ).matches;

            let controlUpdateFrame = null;

            function getScrollAmount() {
                const firstCard =
                    track.querySelector(".research-visual-card");

                if (!firstCard) {
                    return viewport.clientWidth * 0.75;
                }

                const trackStyle =
                    window.getComputedStyle(track);

                const gap =
                    parseFloat(trackStyle.columnGap) || 0;

                return (
                    firstCard.getBoundingClientRect().width +
                    gap
                );
            }

            function updateControls() {
                const maximumScroll =
                    Math.max(
                        0,
                        viewport.scrollWidth -
                        viewport.clientWidth
                    );

                const isAtStart =
                    viewport.scrollLeft <= 2;

                const isAtEnd =
                    viewport.scrollLeft >=
                    maximumScroll - 2;

                previousButton.disabled =
                    isAtStart;

                nextButton.disabled =
                    isAtEnd;

                windowElement.classList.toggle(
                    "is-at-end",
                    isAtEnd
                );
            }

            function scheduleControlUpdate() {
                if (controlUpdateFrame !== null) {
                    return;
                }

                controlUpdateFrame =
                    requestAnimationFrame(() => {
                        updateControls();
                        controlUpdateFrame = null;
                    });
            }

            previousButton.addEventListener(
                "click",
                () => {
                    viewport.scrollBy({
                        left: -getScrollAmount(),
                        behavior: reduceMotion
                            ? "auto"
                            : "smooth"
                    });
                }
            );

            nextButton.addEventListener(
                "click",
                () => {
                    viewport.scrollBy({
                        left: getScrollAmount(),
                        behavior: reduceMotion
                            ? "auto"
                            : "smooth"
                    });
                }
            );

            viewport.addEventListener(
                "scroll",
                scheduleControlUpdate,
                {
                    passive: true
                }
            );

            window.addEventListener(
                "resize",
                scheduleControlUpdate,
                {
                    passive: true
                }
            );

            section
                .querySelectorAll(".research-visual-video")
                .forEach(button => {
                    const video =
                        button.querySelector("video");

                    if (!video) return;

                    function playVideo() {
                        video
                            .play()
                            .then(() => {
                                button.classList.add(
                                    "is-playing"
                                );
                            })
                            .catch(() => {
                                button.classList.remove(
                                    "is-playing"
                                );
                            });
                    }

                    function pauseVideo() {
                        // When the media is temporarily moved into the lightbox,
                        // focus/mouseleave on the card must not stop playback there.
                        if (!button.contains(video)) {
                            return;
                        }

                        video.pause();

                        button.classList.remove(
                            "is-playing"
                        );
                    }

                    function toggleVideo() {
                        if (video.paused) {
                            playVideo();
                        } else {
                            pauseVideo();
                        }
                    }

                    if (canHover && !reduceMotion) {
                        button.addEventListener(
                            "mouseenter",
                            playVideo
                        );

                        button.addEventListener(
                            "mouseleave",
                            pauseVideo
                        );

                        button.addEventListener(
                            "focusin",
                            playVideo
                        );

                        button.addEventListener(
                            "focusout",
                            pauseVideo
                        );
                    }

                    button.addEventListener(
                        "click",
                        event => {
                            if (button.classList.contains("research-visual-open")) {
                                return;
                            }

                            if (
                                canHover &&
                                event.detail > 0
                            ) {
                                return;
                            }

                            toggleVideo();
                        }
                    );

                    video.addEventListener(
                        "pause",
                        () => {
                            button.classList.remove(
                                "is-playing"
                            );
                        }
                    );
                });

            if ("IntersectionObserver" in window) {
                const videoObserver =
                    new IntersectionObserver(
                        entries => {
                            entries.forEach(entry => {
                                if (entry.isIntersecting) {
                                    return;
                                }

                                const video =
                                    entry.target;

                                video.pause();

                                video
                                    .closest(".research-visual-video")
                                    ?.classList.remove(
                                        "is-playing"
                                    );
                            });
                        },
                        {
                            threshold: 0.15
                        }
                    );

                section
                    .querySelectorAll(
                        ".research-visual-video video"
                    )
                    .forEach(video => {
                        videoObserver.observe(video);
                    });
            }

            updateControls();
        }

        document.addEventListener(
            "DOMContentLoaded",
            initialiseResearchVisuals
        );
