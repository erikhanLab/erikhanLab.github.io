    const DEFAULT_LANG = "en";
    const SUPPORTED_LANGS = new Set(["en", "ja"]);

    const researchLandscapeNodes = [
      {
        id: "spatial-roughness",
        label: "Spatial hull roughness",
        layout: "research",
        since: 2025,
        half: 1,
        group: "ship",
        level: "established",
        discovery: "strong"
      },
      {
        id: "boundary-layer",
        label: "Boundary layer",
        layout: "research",
        since: 2025,
        half: 2,
        group: "ship",
        level: "developing",
        discovery: "connected"
      },
      {
        id: "wake",
        label: "Wake",
        layout: "research",
        since: 2025,
        half: 2,
        group: "ship",
        level: "developing",
        discovery: "connected"
      },
      {
        id: "ship-resistance",
        label: "Ship resistance",
        layout: "research",
        since: 2024,
        half: 1,
        group: "ship",
        level: "established",
        discovery: "strong"
      },
      {
        id: "measured-roughness",
        label: "Measured roughness",
        layout: "research",
        since: 2026,
        half: 2,
        group: "ship",
        level: "developing",
        discovery: "emerging"
      },
      {
        id: "full-scale-prediction",
        label: "Full-scale prediction",
        layout: "research",
        since: 2026,
        half: 1,
        group: "ship",
        level: "developing",
        discovery: "emerging"
      },
      {
        id: "model-ship-extrapolation",
        label: "Model–ship extrapolation",
        layout: "research",
        since: 2024,
        half: 1,
        group: "ship",
        level: "established",
        discovery: "connected"
      },
      {
        id: "temperature-effects",
        label: "Temperature effects",
        layout: "research",
        since: 2024,
        half: 1,
        group: "ship",
        level: "developing",
        discovery: "adjacent"
      },
      {
        id: "ittc-assumptions",
        label: "ITTC assumptions",
        layout: "research",
        since: 2024,
        group: "ship",
        level: "developing",
        discovery: "connected"
      },
      {
        id: "added-resistance",
        label: "Added resistance",
        layout: "research",
        since: 2026,
        half: 2,
        group: "waves",
        level: "developing",
        discovery: "emerging"
      },
      {
        id: "wave-body-interaction",
        label: "Wave–body interaction",
        layout: "research",
        since: 2025,
        half: 1,
        group: "waves",
        level: "established",
        discovery: "connected"
      },
      {
        id: "cfd",
        label: "CFD",
        layout: "method",
        since: 2024,
        half: 1,
        group: "method",
        level: "established",
        discovery: "method"
      },
      {
        id: "fsi",
        label: "FSI",
        layout: "method",
        since: 2025,
        half: 1,
        group: "method",
        level: "established",
        discovery: "method"
      }
    ];

    const researchLandscapeLinks = [
      ["spatial-roughness", "boundary-layer", 12],
      ["spatial-roughness", "ship-resistance", -10],
      ["spatial-roughness", "ittc-assumptions", -136],
      ["spatial-roughness", "measured-roughness", -50],
      ["spatial-roughness", "full-scale-prediction", 42],
      ["spatial-roughness", "wake", 18],
      ["boundary-layer", "wake", -10],
      ["boundary-layer", "ship-resistance", 12],
      ["wake", "ship-resistance", 10],
      ["full-scale-prediction", "ship-resistance", -12],
      ["full-scale-prediction", "model-ship-extrapolation", 18],
      ["measured-roughness", "full-scale-prediction", 12],
      ["ship-resistance", "model-ship-extrapolation", -10],
      ["model-ship-extrapolation", "temperature-effects", 12],
      ["model-ship-extrapolation", "ittc-assumptions", 10],
      ["temperature-effects", "ittc-assumptions", -10],
      ["added-resistance", "wave-body-interaction", -12],
      ["cfd", "spatial-roughness", -12],
      ["cfd", "fsi", 10],
      ["cfd", "added-resistance", 10],
      ["cfd", "wave-body-interaction", -12],
      ["cfd", "temperature-effects", -14],
      ["fsi", "wave-body-interaction", -10]
    ];

    const researchLandscapeState = {
      hoveredId: null,
      nodeMap: new Map(),
      adjacency: new Map(),
      nodeElements: new Map(),
      linkElements: [],
      maxConnectivityScore: 1
    };

    const researchLandscapeLevelWeights = {
      established: 1.0,
      developing: 0.6
    };

    const researchLandscapeGlobalOffset = {
      x: -140,
      y: -40
    };

    const researchLandscapeGroupAnchors = {
      ship: {
        x: 390,
        y: 350
      },

      method: {
        x: 520,
        y: 185
      },

      waves: {
        x: 690,
        y: 285
      },

      systems: {
        x: 770,
        y: 390
      }
    };

    const researchLandscapeReservedArea = {
      left: 735,
      right: 980,
      top: 0,
      bottom: 95
    };

    const researchLandscapeMethodX = {
      cfd: 100,
      fsi: 480,
      "cfd-mbd": 700
    };

    const researchLandscapeMethodY = 120;

    const researchLandscapeLayout = {
      method: {
        top: 45,
        bottom: 155
      },

      research: {
        top: 235,
        bottom: 520
      },

      periods: {
        "2024-1": 200,
        "2024-2": 330,

        "2025-1": 460,
        "2025-2": 590,

        "2026-1": 720,
        "2026-2": 850
      }
    };

    let researchScrollMap = [];
    let researchScrollMax = 0;
    let researchMapDirty = true;
    let scrollUpdateScheduled = false;
    let researchLayoutObserver = null;
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

      document
        .querySelectorAll("[data-en]")
        .forEach(element => {
          const value = element.getAttribute(
            `data-${safeLang}`
          );

          if (value !== null) {
            element.innerHTML = value;
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

      const summaryHeading =
        document.querySelector(
          ".research-landscape-summary-heading"
        );

      const summary =
        document.querySelector(
          ".research-landscape-summary"
        );

      if (summaryHeading) {
        summaryHeading.textContent =
          safeLang === "ja"
            ? "主要テーマ"
            : "Core themes";
      }

      if (summary) {
        summary.setAttribute(
          "aria-label",
          safeLang === "ja"
            ? "主要な研究テーマ"
            : "Core research themes"
        );
      }
    }

    function clamp(value, min, max) {
      return Math.min(
        Math.max(value, min),
        max
      );
    }

    function getLandscapeLevelWeight(node) {
      return (
        researchLandscapeLevelWeights[
        node?.level
        ] ?? 1
      );
    }

    function getLandscapeConnectivityScore(nodeId) {
      const node =
        researchLandscapeState
          .nodeMap
          .get(nodeId);

      if (
        !node ||
        node.layout !== "research"
      ) {
        return 0;
      }

      const researchConnectionCount =
        Array.from(
          researchLandscapeState
            .adjacency
            .get(nodeId) ?? []
        )
          .filter(neighborId => {
            const neighbor =
              researchLandscapeState
                .nodeMap
                .get(neighborId);

            return neighbor?.layout === "research";
          })
          .length;

      return (
        researchConnectionCount *
        getLandscapeLevelWeight(node)
      );
    }
    function easeInOutQuint(progress) {
      return progress < 0.5
        ? 16 * Math.pow(progress, 5)
        : 1 -
        Math.pow(
          -2 * progress + 2,
          5
        ) / 2;
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
        destinationY -
        startY;

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
          420 +
          Math.abs(distance) *
          0.16,
          480,
          1050
        );

      const startTime =
        performance.now();

      function animate(currentTime) {
        const elapsed =
          currentTime -
          startTime;

        const progress =
          clamp(
            elapsed /
            duration,
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

          smoothScrollFrame =
            null;
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

    function getResearchSectionDefinitions() {
      const sideNav =
        document.querySelector(
          ".research-side-nav"
        );

      if (!sideNav) {
        return [];
      }

      const landscapeLink =
        sideNav.querySelector(
          'a[href="#research-landscape"]'
        );

      const ongoingLink =
        sideNav.querySelector(
          'a[href="#ongoing-research"]'
        );

      const contextLink =
        sideNav.querySelector(
          'a[href="#research-context"]'
        );

      const timelineLink =
        sideNav.querySelector(
          'a[href="#research-timeline"]'
        );

      const yearLink = year =>
        sideNav.querySelector(
          `a[href="#year-${year}"]`
        );

      const definitions = [
        {
          selector: "#ongoing-research",
          activeLinks: [
            ongoingLink
          ],
          currentLink: ongoingLink
        },
        {
          selector: "#research-landscape",
          activeLinks: [
            landscapeLink
          ],
          currentLink: landscapeLink
        },
        {
          selector: "#research-context",
          activeLinks: [
            contextLink
          ],
          currentLink: contextLink
        },
        {
          selector: "#research-timeline",
          activeLinks: [
            timelineLink
          ],
          currentLink: timelineLink
        },
        {
          selector: "#year-2026",
          activeLinks: [
            timelineLink,
            yearLink("2026")
          ],
          currentLink:
            yearLink("2026")
        },
        {
          selector: "#year-2025",
          activeLinks: [
            timelineLink,
            yearLink("2025")
          ],
          currentLink:
            yearLink("2025")
        },
        {
          selector: "#year-2024",
          activeLinks: [
            timelineLink,
            yearLink("2024")
          ],
          currentLink:
            yearLink("2024")
        },
        {
          selector: "#year-2023",
          activeLinks: [
            timelineLink,
            yearLink("2023")
          ],
          currentLink:
            yearLink("2023")
        }
      ];
      return definitions
        .map(definition => ({
          ...definition,
          target:
            document.querySelector(
              definition.selector
            ),
          activeLinks:
            definition.activeLinks
              .filter(Boolean)
        }))
        .filter(definition =>
          definition.target &&
          definition.currentLink
        );
    }

    function buildResearchScrollMap() {
      const definitions =
        getResearchSectionDefinitions();

      if (!definitions.length) {
        researchScrollMap = [];
        researchScrollMax = 0;
        return;
      }

      const scrollingElement =
        document.scrollingElement ||
        document.documentElement;

      researchScrollMax =
        Math.max(
          0,
          scrollingElement.scrollHeight -
          window.innerHeight
        );

      const firstSection =
        definitions[0].target;

      const lastSection =
        definitions[
          definitions.length - 1
        ].target;

      const contentStart =
        getDocumentTop(
          firstSection
        );

      const contentEnd =
        Math.max(
          contentStart + 1,
          getDocumentTop(
            lastSection
          ) +
          lastSection.offsetHeight
        );

      const contentHeight =
        contentEnd -
        contentStart;

      researchScrollMap =
        definitions.map(
          definition => {
            const sectionTop =
              getDocumentTop(
                definition.target
              );



            const startRatio =
              clamp(
                (
                  sectionTop -
                  contentStart
                ) /
                contentHeight,
                0,
                1
              );

            return {
              ...definition,
              startScroll:
                startRatio *
                researchScrollMax
            };
          }
        );
    }

    function updateResearchSideNavigation() {
      const sideNav =
        document.querySelector(
          ".research-side-nav"
        );

      if (
        !sideNav ||
        !researchScrollMap.length
      ) {
        return;
      }

      const currentScroll =
        clamp(
          window.scrollY,
          0,
          researchScrollMax
        );

      let activeSection =
        researchScrollMap[0];

      for (
        const section of
        researchScrollMap
      ) {
        if (
          currentScroll >=
          section.startScroll
        ) {
          activeSection =
            section;
        } else {
          break;
        }
      }

      sideNav
        .querySelectorAll("a")
        .forEach(link => {
          link.classList.remove(
            "active"
          );

          link.removeAttribute(
            "aria-current"
          );
        });

      activeSection
        .activeLinks
        .forEach(link => {
          link.classList.add(
            "active"
          );
        });

      activeSection
        .currentLink
        ?.setAttribute(
          "aria-current",
          "location"
        );
    }

    function bindResearchSideNavigation() {
      const sideNav =
        document.querySelector(
          ".research-side-nav"
        );

      if (!sideNav) {
        return;
      }

      sideNav.addEventListener(
        "click",
        event => {
          const link =
            event.target.closest(
              'a[href^="#"]'
            );

          if (
            !link ||
            !sideNav.contains(link)
          ) {
            return;
          }

          if (
            researchMapDirty ||
            !researchScrollMap.length
          ) {
            buildResearchScrollMap();

            researchMapDirty =
              false;
          }

          const selector =
            link.getAttribute(
              "href"
            );

          const mappedSection =
            researchScrollMap.find(
              section =>
                section.selector ===
                selector
            );

          if (!mappedSection) {
            return;
          }

          event.preventDefault();

          history.replaceState(
            null,
            "",
            selector
          );

          smoothScrollTo(
            Math.min(
              researchScrollMax,
              mappedSection.startScroll +
              1
            )
          );
        }
      );
    }

    function buildLandscapeAdjacency() {
      researchLandscapeState
        .adjacency
        .clear();

      researchLandscapeNodes
        .forEach(node => {
          researchLandscapeState
            .adjacency
            .set(
              node.id,
              new Set()
            );
        });

      researchLandscapeLinks
        .forEach(
          ([sourceId, targetId]) => {
            const sourceExists =
              researchLandscapeState
                .adjacency
                .has(sourceId);

            const targetExists =
              researchLandscapeState
                .adjacency
                .has(targetId);

            if (
              !sourceExists ||
              !targetExists
            ) {
              return;
            }

            researchLandscapeState
              .adjacency
              .get(sourceId)
              .add(targetId);

            researchLandscapeState
              .adjacency
              .get(targetId)
              .add(sourceId);
          }
        );

      researchLandscapeState.maxConnectivityScore =
        Math.max(
          1,
          ...researchLandscapeNodes
            .filter(
              node =>
                node.layout === "research"
            )
            .map(node =>
              getLandscapeConnectivityScore(
                node.id
              )
            )
        );
    }

    function renderResearchLandscapeSummary(
      activeNodeId = null
    ) {
      const summary =
        document.querySelector(
          ".research-landscape-summary"
        );

      const heading =
        summary?.querySelector(
          ".research-landscape-summary-heading"
        );

      const topic =
        summary?.querySelector(
          ".research-landscape-summary-topic"
        );

      const list =
        summary?.querySelector(
          ".research-landscape-summary-list"
        );

      if (
        !summary ||
        !heading ||
        !topic ||
        !list
      ) {
        return;
      }

      const lang =
        document.documentElement
          .getAttribute("data-lang") === "ja"
          ? "ja"
          : "en";

      list.replaceChildren();

      if (!activeNodeId) {
        heading.textContent =
          lang === "ja"
            ? "主要テーマ"
            : "Core themes";

        topic.textContent = "";

        summary.setAttribute(
          "aria-label",
          lang === "ja"
            ? "主要な研究テーマ"
            : "Core research themes"
        );

        const topNodes =
          researchLandscapeNodes
            .filter(
              node =>
                node.layout === "research" &&
                node.level === "established"
            )
            .map(node => ({
              node,

              connections:
                Array.from(
                  researchLandscapeState
                    .adjacency
                    .get(node.id) ?? []
                )
                  .filter(neighborId => {
                    const neighbor =
                      researchLandscapeState
                        .nodeMap
                        .get(neighborId);

                    return (
                      neighbor?.layout ===
                      "research"
                    );
                  })
                  .length
            }))
            .sort(
              (a, b) =>
                b.connections -
                a.connections ||
                a.node.label.localeCompare(
                  b.node.label
                )
            )
            .slice(0, 3);

        topNodes.forEach(
          ({ node }) => {
            const item =
              document.createElement("li");

            item.textContent =
              node.label;

            list.appendChild(item);
          }
        );

        return;
      }

      const node =
        researchLandscapeState
          .nodeMap
          .get(activeNodeId);

      if (!node) {
        return;
      }

      heading.textContent =
        lang === "ja"
          ? "関連成果"
          : "Related outputs";

      topic.textContent =
        node.label;

      summary.setAttribute(
        "aria-label",
        `${node.label} related outputs`
      );

      const outputs =
        Array.from(
          document.querySelectorAll(
            ".research-timeline .rt-block[data-themes]"
          )
        )
          .filter(block => {
            const themes =
              (
                block.dataset.themes ||
                ""
              )
                .split(/\s+/)
                .filter(Boolean);

            return themes.includes(
              activeNodeId
            );
          })
          .map(block => {
            const year =
              block
                .closest(".rt-item")
                ?.querySelector(
                  ".rt-year"
                )
                ?.textContent
                ?.trim() || "";

            const title =
              block
                .querySelector(
                  ".rt-subtitle"
                )
                ?.textContent
                ?.replace(
                  /\s+/g,
                  " "
                )
                .trim() || "";

            const venueElement =
              block.querySelector(
                ".rt-meta em, .rt-venue"
              );

            const isJournal =
              venueElement?.tagName === "EM";

            const venue =
              venueElement
                ?.dataset
                ?.short
              ||
              venueElement
                ?.textContent
                ?.replace(
                  /\s+/g,
                  " "
                )
                .trim()
              ||
              "";

            const role =
              block
                .querySelector(
                  ".role-tag"
                )
                ?.getAttribute(
                  "data-en"
                )
                ?.trim() || "";

            let citation =
              block.dataset.citation ||
              "";

            if (!citation) {
              if (
                role === "Sole author"
              ) {
                citation =
                  "Han";

              } else if (
                role === "First author" ||
                role ===
                "First & corresponding author" ||
                role ===
                "Presenting author"
              ) {
                citation =
                  "Han et al.";

              } else if (
                role === "Co-author"
              ) {
                citation =
                  "Co-author";
              }
            }

            return {
              year,
              title,
              venue,
              citation,
              isJournal
            };
          })
          .filter(
            output =>
              output.title ||
              output.venue
          )
          .sort(
            (a, b) =>
              Number(b.year) -
              Number(a.year)
          )
          .slice(0, 3);

      if (!outputs.length) {
        const item =
          document.createElement("li");

        item.className =
          "research-landscape-output-empty";

        item.textContent =
          lang === "ja"
            ? "関連成果はまだ登録されていません"
            : "No linked outputs yet";

        list.appendChild(item);

        return;
      }

      outputs.forEach(output => {
        const item =
          document.createElement("li");

        item.className =
          "research-landscape-output-item";

        const title =
          document.createElement("span");

        title.className =
          "research-landscape-output-title";

        title.textContent =
          output.title;

        const meta =
          document.createElement("span");

        meta.className =
          "research-landscape-output-meta";

        const metaParts = [];

        if (output.venue) {
          if (output.isJournal) {
            const journal =
              document.createElement("em");

            journal.textContent =
              output.venue;

            metaParts.push(journal);

          } else {
            const venue =
              document.createElement("span");

            venue.textContent =
              output.venue;

            metaParts.push(venue);
          }
        }

        if (output.year) {
          const year =
            document.createElement("span");

          year.textContent =
            output.year;

          metaParts.push(year);
        }

        if (output.citation) {
          const citation =
            document.createElement("span");

          citation.textContent =
            output.citation;

          metaParts.push(citation);
        }

        metaParts.forEach(
          (part, index) => {
            if (index > 0) {
              meta.appendChild(
                document.createTextNode(
                  " · "
                )
              );
            }

            meta.appendChild(part);
          }
        );

        item.append(
          title,
          meta
        );

        list.appendChild(item);
      });
    }

    function getLandscapeNodeRadius(nodeId) {
      const node =
        researchLandscapeState
          .nodeMap
          .get(nodeId);

      if (node?.layout === "method") {
        return 7;
      }

      const score =
        getLandscapeConnectivityScore(
          nodeId
        );

      const normalized =
        clamp(
          score /
          researchLandscapeState
            .maxConnectivityScore,
          0,
          1
        );

      const minRadius = 5;
      const maxRadius = 20;

      return (
        minRadius +
        Math.pow(
          normalized,
          1.2
        ) *
        (
          maxRadius -
          minRadius
        )
      );
    }

    function getLandscapeSeed(
      text,
      salt = 0
    ) {
      let hash =
        (
          2166136261 ^
          salt
        ) >>> 0;

      for (
        let i = 0;
        i < text.length;
        i++
      ) {
        hash ^=
          text.charCodeAt(i);

        hash =
          Math.imul(
            hash,
            16777619
          ) >>> 0;
      }

      return (
        hash /
        4294967295
      ) * 2 - 1;
    }
    function renderResearchLandscapeYears(svg) {
      const yearLayer =
        svg.querySelector(
          ".landscape-years"
        );

      if (!yearLayer) {
        return;
      }

      yearLayer.replaceChildren();

      const years =
        [2024, 2025, 2026];

      years.forEach(year => {
        const firstHalfX =
          researchLandscapeLayout
            .periods[`${year}-1`];

        const secondHalfX =
          researchLandscapeLayout
            .periods[`${year}-2`];

        if (
          !Number.isFinite(firstHalfX) ||
          !Number.isFinite(secondHalfX)
        ) {
          return;
        }

        const yearX =
          (
            firstHalfX +
            secondHalfX
          ) / 2 +
          researchLandscapeGlobalOffset.x;

        const yearLabel =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );

        yearLabel.classList.add(
          "landscape-year-label"
        );

        yearLabel.setAttribute(
          "x",
          clamp(yearX, 65, 920)
        );

        yearLabel.setAttribute(
          "y",
          545
        );

        yearLabel.textContent =
          year;

        yearLayer.appendChild(
          yearLabel
        );

        [1, 2].forEach(half => {
          const periodX =
            researchLandscapeLayout
              .periods[
            `${year}-${half}`
            ] +
            researchLandscapeGlobalOffset.x;

          const halfLabel =
            document.createElementNS(
              "http://www.w3.org/2000/svg",
              "text"
            );

          halfLabel.classList.add(
            "landscape-half-label"
          );

          halfLabel.setAttribute(
            "x",
            clamp(periodX, 55, 940)
          );

          halfLabel.setAttribute(
            "y",
            518
          );

          halfLabel.textContent =
            `H${half}`;

          yearLayer.appendChild(
            halfLabel
          );
        });
      });
    }

    function getLandscapePeriodX(node) {
      if (
        node.layout !== "research" ||
        !Number.isFinite(node.since) ||
        !Number.isFinite(node.half)
      ) {
        return null;
      }

      const key =
        `${node.since}-${node.half}`;

      return (
        researchLandscapeLayout
          .periods[key] ??
        null
      );
    }

    function getLandscapeNodeSizeClass(nodeId) {
      const node =
        researchLandscapeState
          .nodeMap
          .get(nodeId);

      if (node?.layout === "method") {
        return "small";
      }

      const score =
        getLandscapeConnectivityScore(
          nodeId
        );

      const normalized =
        score /
        researchLandscapeState
          .maxConnectivityScore;

      return normalized >= 0.5
        ? "large"
        : "small";
    }

    function getLandscapeLabelWidth(
      node
    ) {
      const sizeClass =
        getLandscapeNodeSizeClass(
          node.id
        );

      const characterWidth =
        sizeClass === "large"
          ? 7.6
          : 6.6;

      return Math.min(
        190,
        node.label.length *
        characterWidth
      );
    }

    function getLandscapeLinkPath(
      source,
      target,
      curve = 0
    ) {
      const dx =
        target.x -
        source.x;

      const dy =
        target.y -
        source.y;

      const length =
        Math.hypot(
          dx,
          dy
        ) || 1;

      const midpointX =
        (
          source.x +
          target.x
        ) / 2;

      const midpointY =
        (
          source.y +
          target.y
        ) / 2;

      const normalX =
        -dy /
        length;

      const normalY =
        dx /
        length;

      const controlX =
        midpointX +
        normalX *
        curve;

      const controlY =
        midpointY +
        normalY *
        curve;

      return [
        `M ${source.x} ${source.y}`,
        `Q ${controlX} ${controlY}`,
        `${target.x} ${target.y}`
      ].join(" ");
    }

    function autoLayoutResearchLandscape() {
      const nodes =
        researchLandscapeNodes;

      const states =
        new Map();

      nodes.forEach(node => {
        const anchor =
          researchLandscapeGroupAnchors[
          node.group
          ] || {
            x: 500,
            y: 280
          };

        const isMethod =
          node.layout === "method";

        const methodX =
          researchLandscapeMethodX[
          node.id
          ];

        states.set(
          node.id,
          {
            x:
              isMethod &&
                Number.isFinite(methodX)
                ? methodX
                : anchor.x +
                getLandscapeSeed(
                  node.id,
                  1
                ) * 80,

            y:
              isMethod
                ? researchLandscapeMethodY
                : anchor.y +
                getLandscapeSeed(
                  node.id,
                  2
                ) * 65,

            vx: 0,
            vy: 0,
            fx: 0,
            fy: 0
          }
        );
      });

      const iterations = 520;

      for (
        let iteration = 0;
        iteration < iterations;
        iteration++
      ) {
        states.forEach(state => {
          state.fx = 0;
          state.fy = 0;
        });

        for (
          let i = 0;
          i < nodes.length;
          i++
        ) {
          const nodeA =
            nodes[i];

          const stateA =
            states.get(
              nodeA.id
            );

          for (
            let j = i + 1;
            j < nodes.length;
            j++
          ) {
            const nodeB =
              nodes[j];

            const stateB =
              states.get(
                nodeB.id
              );

            let dx =
              stateB.x -
              stateA.x;

            let dy =
              stateB.y -
              stateA.y;

            let distanceSquared =
              dx * dx +
              dy * dy;

            if (
              distanceSquared <
              0.0001
            ) {
              dx =
                getLandscapeSeed(
                  nodeA.id +
                  nodeB.id,
                  11
                ) * 0.1;

              dy =
                getLandscapeSeed(
                  nodeA.id +
                  nodeB.id,
                  12
                ) * 0.1;

              distanceSquared =
                dx * dx +
                dy * dy;
            }

            const distance =
              Math.sqrt(
                distanceSquared
              );

            const nx =
              dx /
              distance;

            const ny =
              dy /
              distance;

            const repulsion =
              Math.min(
                3.4,
                7600 /
                (
                  distanceSquared +
                  450
                )
              );

            stateA.fx -=
              nx *
              repulsion;

            stateA.fy -=
              ny *
              repulsion;

            stateB.fx +=
              nx *
              repulsion;

            stateB.fy +=
              ny *
              repulsion;

            const radiusA =
              getLandscapeNodeRadius(
                nodeA.id
              );

            const radiusB =
              getLandscapeNodeRadius(
                nodeB.id
              );

            const minimumDistance =
              Math.max(
                110,
                radiusA +
                radiusB +
                24
              );

            if (
              distance <
              minimumDistance
            ) {
              const force =
                (
                  minimumDistance -
                  distance
                ) * 0.24;

              stateA.fx -=
                nx *
                force;

              stateA.fy -=
                ny *
                force;

              stateB.fx +=
                nx *
                force;

              stateB.fy +=
                ny *
                force;
            }

            const labelWidthA =
              getLandscapeLabelWidth(
                nodeA
              );

            const labelWidthB =
              getLandscapeLabelWidth(
                nodeB
              );

            const leftA =
              stateA.x -
              radiusA -
              5;

            const rightA =
              stateA.x +
              radiusA +
              10 +
              labelWidthA;

            const topA =
              stateA.y -
              17;

            const bottomA =
              stateA.y +
              17;

            const leftB =
              stateB.x -
              radiusB -
              5;

            const rightB =
              stateB.x +
              radiusB +
              10 +
              labelWidthB;

            const topB =
              stateB.y -
              17;

            const bottomB =
              stateB.y +
              17;

            const overlapX =
              Math.min(
                rightA,
                rightB
              ) -
              Math.max(
                leftA,
                leftB
              );

            const overlapY =
              Math.min(
                bottomA,
                bottomB
              ) -
              Math.max(
                topA,
                topB
              );

            if (
              overlapX > 0 &&
              overlapY > 0
            ) {
              const direction =
                stateA.y <=
                  stateB.y
                  ? -1
                  : 1;

              const force =
                (
                  overlapY +
                  14
                ) * 0.12;

              stateA.fy +=
                direction *
                force;

              stateB.fy -=
                direction *
                force;
            }
          }
        }

        researchLandscapeLinks.forEach(
          ([sourceId, targetId]) => {
            const sourceNode =
              researchLandscapeState
                .nodeMap
                .get(sourceId);

            const targetNode =
              researchLandscapeState
                .nodeMap
                .get(targetId);

            const source =
              states.get(
                sourceId
              );

            const target =
              states.get(
                targetId
              );

            if (
              !sourceNode ||
              !targetNode ||
              !source ||
              !target
            ) {
              return;
            }

            const dx =
              target.x -
              source.x;

            const dy =
              target.y -
              source.y;

            const distance =
              Math.hypot(
                dx,
                dy
              ) || 1;

            const nx =
              dx /
              distance;

            const ny =
              dy /
              distance;

            const desiredDistance =
              sourceNode.group ===
                targetNode.group
                ? 125
                : 175;

            const spring =
              (
                distance -
                desiredDistance
              ) * 0.016;

            source.fx +=
              nx *
              spring;

            source.fy +=
              ny *
              spring;

            target.fx -=
              nx *
              spring;

            target.fy -=
              ny *
              spring;
          }
        );

        nodes.forEach(node => {
          const state =
            states.get(
              node.id
            );

          const anchor =
            researchLandscapeGroupAnchors[
            node.group
            ] || {
              x: 500,
              y: 280
            };

          if (
            node.layout ===
            "research"
          ) {

            state.fx +=
              (
                anchor.x -
                state.x
              ) * 0.00025;

            state.fy +=
              (
                anchor.y -
                state.y
              ) * 0.0018;

            const periodX =
              getLandscapePeriodX(
                node
              );

            if (
              periodX !== null
            ) {
              state.fx +=
                (
                  periodX -
                  state.x
                ) * 0.065;
            }

            const {
              top,
              bottom
            } =
              researchLandscapeLayout
                .research;

            if (
              state.y <
              top
            ) {
              state.fy +=
                (
                  top -
                  state.y
                ) * 0.04;
            }

            if (
              state.y >
              bottom
            ) {
              state.fy +=
                (
                  bottom -
                  state.y
                ) * 0.04;
            }

          } else if (
            node.layout ===
            "method"
          ) {
            const methodX =
              researchLandscapeMethodX[
              node.id
              ];

            if (
              Number.isFinite(
                methodX
              )
            ) {
              state.fx +=
                (
                  methodX -
                  state.x
                ) * 0.08;
            }

            state.fy = 0;
          }

          state.vx =
            (
              state.vx +
              state.fx
            ) * 0.82;

          if (
            node.layout ===
            "method"
          ) {
            state.vy = 0;
          } else {
            state.vy =
              (
                state.vy +
                state.fy
              ) * 0.82;
          }

          const speed =
            Math.hypot(
              state.vx,
              state.vy
            );

          const maximumSpeed = 5;

          if (
            speed >
            maximumSpeed
          ) {
            state.vx *=
              maximumSpeed /
              speed;

            state.vy *=
              maximumSpeed /
              speed;
          }

          state.x +=
            state.vx;

          if (
            node.layout ===
            "method"
          ) {

            state.y =
              researchLandscapeMethodY;

            state.vy = 0;
          } else {
            state.y +=
              state.vy;
          }

          const radius =
            getLandscapeNodeRadius(
              node.id
            );

          const labelWidth =
            getLandscapeLabelWidth(
              node
            );

          const minX =
            45 +
            radius;

          const maxX =
            970 -
            (
              radius +
              10 +
              labelWidth
            );

          state.x =
            clamp(
              state.x,
              minX,
              maxX
            );

          if (
            node.layout ===
            "research"
          ) {
            state.y =
              clamp(
                state.y,
                researchLandscapeLayout
                  .research
                  .top,
                researchLandscapeLayout
                  .research
                  .bottom
              );

            const nodeLeft =
              state.x -
              radius -
              5;

            const nodeRight =
              state.x +
              radius +
              10 +
              labelWidth;

            const nodeTop =
              state.y -
              18;

            const nodeBottom =
              state.y +
              18;

            const overlapsReservedArea =
              nodeRight >
              researchLandscapeReservedArea
                .left &&
              nodeLeft <
              researchLandscapeReservedArea
                .right &&
              nodeBottom >
              researchLandscapeReservedArea
                .top &&
              nodeTop <
              researchLandscapeReservedArea
                .bottom;

            if (
              overlapsReservedArea
            ) {
              state.y =
                researchLandscapeReservedArea
                  .bottom +
                28;

              state.vy =
                Math.abs(
                  state.vy
                ) * 0.2;
            }

          } else if (
            node.layout ===
            "method"
          ) {

            state.y =
              researchLandscapeMethodY;

            state.vy = 0;
          }
        });
      }

      nodes.forEach(node => {
        const state =
          states.get(
            node.id
          );

        const radius =
          getLandscapeNodeRadius(
            node.id
          );

        const labelWidth =
          getLandscapeLabelWidth(
            node
          );

        const minX =
          45 +
          radius;

        const maxX =
          970 -
          (
            radius +
            10 +
            labelWidth
          );

        node.x =
          Math.round(
            clamp(
              state.x +
              researchLandscapeGlobalOffset.x,
              minX,
              maxX
            ) * 10
          ) / 10;

        if (
          node.layout ===
          "method"
        ) {
          node.y =
            Math.round(
              (
                researchLandscapeMethodY +
                researchLandscapeGlobalOffset.y
              ) * 10
            ) / 10;

        } else {
          node.y =
            Math.round(
              (
                state.y +
                researchLandscapeGlobalOffset.y
              ) * 10
            ) / 10;
        }
      });
    }

    function updateLandscapeInteractionState() {
      const activeId =
        researchLandscapeState.hoveredId;

      const neighbors =
        activeId
          ? researchLandscapeState
            .adjacency
            .get(activeId)
          : null;

      researchLandscapeState
        .nodeElements
        .forEach(
          (
            element,
            nodeId
          ) => {
            const isActive =
              nodeId ===
              activeId;

            const isNeighbor =
              Boolean(
                activeId &&
                neighbors?.has(
                  nodeId
                )
              );

            const isDimmed =
              Boolean(
                activeId &&
                !isActive &&
                !isNeighbor
              );

            element.classList.toggle(
              "is-active",
              isActive
            );

            element.classList.toggle(
              "is-neighbor",
              isNeighbor
            );

            element.classList.toggle(
              "is-dimmed",
              isDimmed
            );
          }
        );

      researchLandscapeState
        .linkElements
        .forEach(element => {
          const connected =
            Boolean(
              activeId &&
              (
                element.dataset.source ===
                activeId ||
                element.dataset.target ===
                activeId
              )
            );

          element.classList.toggle(
            "is-connected",
            connected
          );

          element.classList.toggle(
            "is-muted",
            Boolean(
              activeId &&
              !connected
            )
          );
        });

      renderResearchLandscapeSummary(
        activeId
      );
    }

    function initResearchLandscape() {
      researchLandscapeState.nodeMap =
        new Map(
          researchLandscapeNodes.map(
            node => [
              node.id,
              node
            ]
          )
        );

      researchLandscapeState
        .nodeElements
        .clear();

      researchLandscapeState
        .linkElements = [];

      buildLandscapeAdjacency();

      renderResearchLandscapeSummary();

      autoLayoutResearchLandscape();

      const svg =
        document.querySelector(
          "#research-landscape-svg"
        );

      if (!svg) {
        return;
      }

      renderResearchLandscapeYears(
        svg
      );

      const linkLayer =
        svg.querySelector(
          ".landscape-links"
        );

      const nodeLayer =
        svg.querySelector(
          ".landscape-nodes"
        );

      if (
        !linkLayer ||
        !nodeLayer
      ) {
        return;
      }

      linkLayer.replaceChildren();
      nodeLayer.replaceChildren();

      researchLandscapeLinks.forEach(
        (
          [
            sourceId,
            targetId,
            curve = 0
          ]
        ) => {
          const source =
            researchLandscapeState
              .nodeMap
              .get(sourceId);

          const target =
            researchLandscapeState
              .nodeMap
              .get(targetId);

          if (
            !source ||
            !target
          ) {
            return;
          }

          const path =
            document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path"
            );

          path.setAttribute(
            "d",
            getLandscapeLinkPath(
              source,
              target,
              curve
            )
          );

          path.classList.add(
            "landscape-link"
          );

          path.dataset.source =
            sourceId;

          path.dataset.target =
            targetId;

          linkLayer.appendChild(
            path
          );

          researchLandscapeState
            .linkElements
            .push(path);
        }
      );

      researchLandscapeNodes.forEach(
        node => {
          const group =
            document.createElementNS(
              "http://www.w3.org/2000/svg",
              "g"
            );

          group.classList.add(
            "landscape-node"
          );

          group.dataset.node =
            node.id;

          group.dataset.group =
            node.group || "";

          group.dataset.discovery =
            node.discovery || "";

          group.dataset.level =
            node.level || "developing";

          group.dataset.size =
            getLandscapeNodeSizeClass(
              node.id
            );

          group.setAttribute(
            "transform",
            `translate(${node.x} ${node.y})`
          );

          group.setAttribute(
            "aria-label",
            node.label
          );

          const radius =
            getLandscapeNodeRadius(
              node.id
            );

          let shape;

          if (node.layout === "method") {
            const connectionCount =
              researchLandscapeState.adjacency
                .get(node.id)?.size ?? 0;

            const width =
              node.id === "cfd"
                ? 22
                : 19;

            const height =
              node.id === "cfd"
                ? 12
                : 11;

            shape =
              document.createElementNS(
                "http://www.w3.org/2000/svg",
                "rect"
              );

            shape.classList.add(
              "landscape-node-shape",
              "landscape-node-method"
            );

            shape.setAttribute(
              "x",
              -width / 2
            );

            shape.setAttribute(
              "y",
              -height / 2
            );

            shape.setAttribute(
              "width",
              width
            );

            shape.setAttribute(
              "height",
              height
            );

            shape.setAttribute(
              "rx",
              3
            );

          } else {
            shape =
              document.createElementNS(
                "http://www.w3.org/2000/svg",
                "circle"
              );

            shape.classList.add(
              "landscape-node-shape",
              "landscape-node-circle"
            );

            shape.setAttribute(
              "r",
              radius
            );
          }

          const label =
            document.createElementNS(
              "http://www.w3.org/2000/svg",
              "text"
            );

          label.classList.add(
            "landscape-node-label"
          );

          const labelOffset =
            node.layout === "method"
              ? 18
              : radius + 10;

          label.setAttribute(
            "x",
            labelOffset
          );

          label.setAttribute(
            "y",
            5
          );

          label.textContent =
            node.label;

          group.append(
            shape,
            label
          );
          nodeLayer.appendChild(
            group
          );

          researchLandscapeState
            .nodeElements
            .set(
              node.id,
              group
            );

          group.addEventListener(
            "mouseenter",
            () => {
              researchLandscapeState
                .hoveredId =
                node.id;

              updateLandscapeInteractionState();
            }
          );

          group.addEventListener(
            "mouseleave",
            () => {
              if (
                researchLandscapeState
                  .hoveredId ===
                node.id
              ) {
                researchLandscapeState
                  .hoveredId =
                  null;
              }

              updateLandscapeInteractionState();
            }
          );
        }
      );

      updateLandscapeInteractionState();
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

    function schedulePageUpdate(
      rebuildMap = false
    ) {
      if (rebuildMap) {
        researchMapDirty =
          true;
      }

      if (
        scrollUpdateScheduled
      ) {
        return;
      }

      scrollUpdateScheduled =
        true;

      requestAnimationFrame(
        () => {
          if (
            researchMapDirty
          ) {
            buildResearchScrollMap();

            researchMapDirty =
              false;
          }

          updateNavigationState();

          updateResearchSideNavigation();

          scrollUpdateScheduled =
            false;
        }
      );
    }

    function observeResearchLayout() {
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

      researchLayoutObserver =
        new ResizeObserver(
          () => {
            schedulePageUpdate(
              true
            );
          }
        );

      researchLayoutObserver.observe(
        pageContent
      );
    }

    window.addEventListener(
      "scroll",
      () => {
        schedulePageUpdate(
          false
        );
      },
      {
        passive: true
      }
    );

    window.addEventListener(
      "resize",
      () => {
        schedulePageUpdate(
          true
        );
      },
      {
        passive: true
      }
    );

    window.addEventListener(
      "load",
      () => {
        schedulePageUpdate(
          true
        );
      }
    );

    document.addEventListener(
      "DOMContentLoaded",
      () => {
        applyLang(
          getSessionLang()
        );

        document
          .querySelector(
            ".page-content"
          )
          ?.classList.add(
            "loaded"
          );

        initResearchLandscape();

        bindResearchSideNavigation();

        observeResearchLayout();

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

                schedulePageUpdate(
                  true
                );
              }
            );
          });

        schedulePageUpdate(
          true
        );
      }
    );
  
