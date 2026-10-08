const DEFAULT_LANG = "en";
    const SUPPORTED_LANGS = new Set(["en", "ja"]);

    let archiveScrollMap = [];
    let archiveScrollMax = 0;
    let archiveMapDirty = true;
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
  

    document.querySelectorAll('.zoomable-drawing').forEach(img => {
      img.addEventListener('click', () => {
        const overlay = document.createElement('div');
        overlay.className = 'zoom-overlay';

        const wrapper = document.createElement('div');
        wrapper.className = 'zoom-overlay-content';

        const clone = img.cloneNode();
        clone.style.width = '100%';
        clone.style.maxWidth = '90vw';
        clone.style.height = 'auto';
        clone.style.maxHeight = '80vh';


        const meta = document.createElement('div');
        meta.className = 'zoom-meta';

        const title = document.createElement('div');
        title.className = 'zoom-title';
        title.textContent = img.dataset.title || '';

        const metaLine = document.createElement('div');
        metaLine.className = 'zoom-meta-line';
        metaLine.textContent = img.dataset.meta || '';

        const desc = document.createElement('div');
        desc.className = 'zoom-desc';
        desc.textContent = img.dataset.desc || '';

        meta.appendChild(title);
        meta.appendChild(metaLine);
        meta.appendChild(desc);
        wrapper.appendChild(clone);
        wrapper.appendChild(meta);
        overlay.appendChild(wrapper);

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('active'));

        overlay.addEventListener("click", () => {
          overlay.classList.remove("active");

          setTimeout(() => {
            overlay.remove();
          }, 200);
        });
      });
    });
