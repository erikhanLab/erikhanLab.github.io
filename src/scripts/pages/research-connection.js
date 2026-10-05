const DEFAULT_LANG = "en";

    const SUPPORTED_LANGS =
      new Set([
        "en",
        "ja"
      ]);


    function getSessionLang() {
      const saved =
        sessionStorage.getItem("lang");

      return SUPPORTED_LANGS.has(saved)
        ? saved
        : DEFAULT_LANG;
    }


    function applyLang(lang) {
      const safeLang =
        SUPPORTED_LANGS.has(lang)
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

      document
        .querySelectorAll("[data-en]")
        .forEach(element => {
          const value =
            element.getAttribute(
              `data-${safeLang}`
            );

          if (value !== null) {
            element.textContent = value;
          }
        });

      document
        .querySelectorAll("[data-aria-en]")
        .forEach(element => {
          const value =
            element.getAttribute(
              `data-aria-${safeLang}`
            );

          if (value !== null) {
            element.setAttribute(
              "aria-label",
              value
            );
          }
        });

      document
        .querySelectorAll(".lang-switch a")
        .forEach(link => {
          link.classList.toggle(
            "active",
            link.dataset.lang === safeLang
          );
        });

      document.title =
        safeLang === "ja"
          ? "主な研究交流 | Sangseok Han"
          : "Selected Research Interactions | Sangseok Han";

      const description =
        document.querySelector(
          'meta[name="description"]'
        );

      if (description) {
        description.setAttribute(
          "content",
          safeLang === "ja"
            ? "主な共同研究、研究上のつながり、研究訪問、および共同成果の記録。"
            : "Selected collaborations, research connections, visits, and shared outputs involving Sangseok Han."
        );
      }
    }


    const AFFILIATION_FILTERS =
      new Set([
        "all",
        "inha",
        "osaka",
        "pusan",
        "snu",
        "siemens",
        "southampton",
        "strathclyde"
      ]);


    let connectionUpdateScheduled = false;
    let connectionLayoutObserver = null;
    let smoothScrollFrame = null;


    function clamp(value, min, max) {
      return Math.min(
        Math.max(value, min),
        max
      );
    }


    function easeInOutQuint(progress) {
      return progress < 0.5
        ? 16 * Math.pow(progress, 5)
        : 1 - Math.pow(-2 * progress + 2, 5) / 2;
    }


    function cancelSmoothScroll() {
      if (smoothScrollFrame !== null) {
        cancelAnimationFrame(
          smoothScrollFrame
        );

        smoothScrollFrame = null;
      }
    }


    function smoothScrollTo(targetY) {
      cancelSmoothScroll();

      const scrollingElement =
        document.scrollingElement ||
        document.documentElement;

      const maximumScrollY =
        Math.max(
          0,
          scrollingElement.scrollHeight -
          window.innerHeight
        );

      const startY =
        window.scrollY;

      const destinationY =
        clamp(
          targetY,
          0,
          maximumScrollY
        );

      const distance =
        destinationY - startY;

      if (Math.abs(distance) < 1) {
        window.scrollTo(
          0,
          destinationY
        );

        return;
      }

      const reduceMotion =
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

      if (reduceMotion) {
        window.scrollTo(
          0,
          destinationY
        );

        return;
      }

      const duration =
        clamp(
          420 + Math.abs(distance) * 0.16,
          480,
          1050
        );

      const startTime =
        performance.now();

      function animate(currentTime) {
        const elapsed =
          currentTime - startTime;

        const progress =
          clamp(
            elapsed / duration,
            0,
            1
          );

        const easedProgress =
          easeInOutQuint(
            progress
          );

        window.scrollTo(
          0,
          startY +
          distance *
          easedProgress
        );

        if (progress < 1) {
          smoothScrollFrame =
            requestAnimationFrame(
              animate
            );
        } else {
          window.scrollTo(
            0,
            destinationY
          );

          smoothScrollFrame = null;
        }
      }

      smoothScrollFrame =
        requestAnimationFrame(
          animate
        );
    }


    function getDocumentTop(element) {
      return (
        element
          .getBoundingClientRect()
          .top +
        window.scrollY
      );
    }


    const CONNECTION_SCROLL_OFFSET = 80;


    const CONNECTION_GROUPS = [
      {
        id: "outputs",
        labelEn: "Shared Outputs",
        labelJa: "共同成果"
      },
      {
        id: "exchanges",
        labelEn: "Connections & Visits",
        labelJa: "つながり・訪問"
      }
    ];


    function buildConnectionGroupNavigation() {
      const nav =
        document.querySelector(
          ".connection-side-nav-list"
        );

      if (!nav) {
        return;
      }

      nav.innerHTML =
        CONNECTION_GROUPS
          .filter(group => {
            const label =
              document.querySelector(
                `[data-collab-group-label="${group.id}"]`
              );

            return (
              label &&
              !label.hidden
            );
          })
          .map(group => `
            <a
              class="connection-side-nav-group"
              href="#connection-group-${group.id}"
              data-en="${group.labelEn}"
              data-ja="${group.labelJa}">
              ${group.labelEn}
            </a>
          `)
          .join("");

      applyLang(
        getSessionLang()
      );

      updateConnectionSideNavigation();
    }


    function updateConnectionSideNavigation() {
      const sideNav =
        document.querySelector(
          ".connection-side-nav"
        );

      if (!sideNav) {
        return;
      }

      const visibleGroups =
        CONNECTION_GROUPS
          .map(group => {
            const target =
              document.querySelector(
                `#connection-group-${group.id}`
              );

            return {
              ...group,
              target
            };
          })
          .filter(group =>
            group.target &&
            !group.target.hidden
          );

      if (!visibleGroups.length) {
        return;
      }

      const activationLine =
        window.innerHeight * 0.30;

      const documentHeight =
        Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight
        );

      const isAtBottom =
        window.scrollY +
        window.innerHeight >=
        documentHeight - 4;

      let activeGroup =
        visibleGroups[0];

      if (isAtBottom) {
        activeGroup =
          visibleGroups[
          visibleGroups.length - 1
          ];
      } else {
        for (const group of visibleGroups) {
          const top =
            group.target
              .getBoundingClientRect()
              .top;

          if (top <= activationLine) {
            activeGroup = group;
          } else {
            break;
          }
        }
      }

      sideNav
        .querySelectorAll(
          ".connection-side-nav-group"
        )
        .forEach(link => {
          link.classList.remove(
            "active"
          );

          link.removeAttribute(
            "aria-current"
          );
        });

      const activeLink =
        sideNav.querySelector(
          `a[href="#connection-group-${activeGroup.id}"]`
        );

      if (activeLink) {
        activeLink.classList.add(
          "active"
        );

        activeLink.setAttribute(
          "aria-current",
          "location"
        );
      }
    }

    function scheduleConnectionUpdate() {
      if (connectionUpdateScheduled) {
        return;
      }

      connectionUpdateScheduled = true;

      requestAnimationFrame(() => {
        updateNavigationState();
        updateConnectionSideNavigation();

        connectionUpdateScheduled = false;
      });
    }


    function bindConnectionSideNavigation() {
      const sideNav =
        document.querySelector(
          ".connection-side-nav"
        );

      if (!sideNav) {
        return;
      }

      sideNav.addEventListener(
        "click",
        event => {
          const link =
            event.target.closest(
              ".connection-side-nav-group"
            );

          if (
            !link ||
            !sideNav.contains(link)
          ) {
            return;
          }

          const selector =
            link.getAttribute(
              "href"
            );

          if (!selector) {
            return;
          }

          const target =
            document.querySelector(
              selector
            );

          if (!target) {
            return;
          }

          event.preventDefault();

          history.replaceState(
            null,
            "",
            selector
          );

          smoothScrollTo(
            getDocumentTop(target) -
            CONNECTION_SCROLL_OFFSET
          );
        }
      );
    }


    function observeConnectionLayout() {
      const pageContent =
        document.querySelector(
          ".page-content"
        );

      if (
        !pageContent ||
        !("ResizeObserver" in window)
      ) {
        return;
      }

      connectionLayoutObserver =
        new ResizeObserver(() => {
          scheduleConnectionUpdate();
        });

      connectionLayoutObserver.observe(
        pageContent
      );
    }


    function applyAffiliationFilter(filter) {
      const safeFilter =
        AFFILIATION_FILTERS.has(filter)
          ? filter
          : "all";

      const entries =
        Array.from(
          document.querySelectorAll(
            ".collab-entry[data-affiliation]"
          )
        );

      entries.forEach(entry => {
        const shouldShow =
          safeFilter === "all" ||
          entry.dataset.affiliation ===
          safeFilter;

        entry.hidden =
          !shouldShow;

        entry.classList.remove(
          "is-last-visible"
        );
      });

      const visibleEntries =
        entries.filter(
          entry =>
            !entry.hidden
        );

      const groupIds = [
        "outputs",
        "exchanges"
      ];

      const visibleGroups = {};

      groupIds.forEach(groupId => {
        const groupEntries =
          visibleEntries.filter(
            entry =>
              entry.dataset.connectionGroup ===
              groupId
          );

        visibleGroups[groupId] =
          groupEntries.length > 0;

        const groupLabel =
          document.querySelector(
            `[data-collab-group-label="${groupId}"]`
          );

        if (groupLabel) {
          groupLabel.hidden =
            !visibleGroups[groupId];
        }
      });

      const exchangeDivider =
        document.querySelector(
          '[data-collab-group-divider="exchanges"]'
        );

      if (exchangeDivider) {
        exchangeDivider.hidden =
          !visibleGroups.outputs ||
          !visibleGroups.exchanges;
      }

      const lastVisibleEntry =
        visibleEntries[
        visibleEntries.length - 1
        ];

      if (lastVisibleEntry) {
        lastVisibleEntry.classList.add(
          "is-last-visible"
        );
      }

      buildConnectionGroupNavigation();

      scheduleConnectionUpdate();

      document
        .querySelectorAll(
          ".collab-filter"
        )
        .forEach(button => {
          const isActive =
            button.dataset.affiliationFilter ===
            safeFilter;

          button.classList.toggle(
            "is-active",
            isActive
          );

          button.setAttribute(
            "aria-pressed",
            String(isActive)
          );
        });
    }


    function updateNavigationState() {
      const nav =
        document.querySelector(
          ".nav"
        );

      if (!nav) {
        return;
      }

      nav.classList.toggle(
        "is-scrolled",
        window.scrollY > 24
      );
    }


    document.addEventListener(
      "DOMContentLoaded",
      () => {
        applyLang(
          getSessionLang()
        );

        document
          .querySelectorAll(
            ".lang-switch a"
          )
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

                applyLang(
                  selected
                );
              }
            );
          });

        document
          .querySelectorAll(
            ".collab-filter"
          )
          .forEach(button => {
            button.addEventListener(
              "click",
              () => {
                applyAffiliationFilter(
                  button.dataset.affiliationFilter
                );
              }
            );
          });

        bindConnectionSideNavigation();
        observeConnectionLayout();

        applyAffiliationFilter(
          "all"
        );

        scheduleConnectionUpdate();
        updateNavigationState();
      }
    );


    window.addEventListener(
      "scroll",
      () => {
        scheduleConnectionUpdate();
      },
      {
        passive: true
      }
    );


    window.addEventListener(
      "resize",
      () => {
        scheduleConnectionUpdate();
      },
      {
        passive: true
      }
    );


    window.addEventListener(
      "load",
      () => {
        document
          .querySelector(
            ".page-content"
          )
          ?.classList.add(
            "loaded"
          );

        scheduleConnectionUpdate();
      }
    );
