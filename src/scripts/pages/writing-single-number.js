    const DEFAULT_LANG =
      "en";

    const SUPPORTED_LANGS =
      new Set([
        "en",
        "ja"
      ]);


    function getSessionLang() {

      const saved =
        sessionStorage.getItem(
          "lang"
        );

      return (
        SUPPORTED_LANGS.has(saved)
          ? saved
          : DEFAULT_LANG
      );

    }


    function applyLang(lang) {

      const safeLang =
        SUPPORTED_LANGS.has(lang)
          ? lang
          : DEFAULT_LANG;


      document.documentElement
        .setAttribute(
          "lang",
          safeLang
        );


      document.documentElement
        .setAttribute(
          "data-lang",
          safeLang
        );


      document
        .querySelectorAll(
          "[data-en]"
        )
        .forEach(element => {

          const value =
            element.getAttribute(
              `data-${safeLang}`
            );

          if (value !== null) {
            element.textContent =
              value;
          }

        });


      document
        .querySelectorAll(
          ".lang-switch a"
        )
        .forEach(link => {

          link.classList.toggle(
            "active",
            link.dataset.lang ===
            safeLang
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

        const lang =
          getSessionLang();

        applyLang(lang);


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


        updateNavigationState();

      }
    );


    window.addEventListener(
      "scroll",
      updateNavigationState,
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

      }
    );
  
