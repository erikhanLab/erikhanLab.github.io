function showYear(id, el) {

      document.querySelectorAll('.year-section')
        .forEach(sec => sec.classList.remove('active'));

      document.getElementById(id).classList.add('active');

      document.querySelectorAll('.year-tabs span')
        .forEach(tab => tab.classList.remove('active'));

      el.classList.add('active');
    }

    const DEFAULT_LANG = "en";
    const SUPPORTED_LANGS = new Set(["en", "ja"]);

    function getSessionLang() {
      const saved = sessionStorage.getItem("lang");
      return SUPPORTED_LANGS.has(saved) ? saved : DEFAULT_LANG;
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

      document.querySelectorAll("[data-en]").forEach(element => {
        const value =
          element.getAttribute(`data-${safeLang}`);

        if (value !== null) {
          element.textContent = value;
        }
      });

      document.querySelectorAll("[data-alt-en]").forEach(element => {
        const value =
          element.getAttribute(`data-alt-${safeLang}`);

        if (value !== null) {
          element.setAttribute("alt", value);
        }
      });

      document.querySelectorAll("[data-aria-en]").forEach(element => {
        const value =
          element.getAttribute(`data-aria-${safeLang}`);

        if (value !== null) {
          element.setAttribute("aria-label", value);
        }
      });

      document.querySelectorAll(".lang-switch a").forEach(link => {
        link.classList.toggle(
          "active",
          link.dataset.lang === safeLang
        );
      });

      document.title =
        safeLang === "ja"
          ? "研究ログ | Sangseok Han"
          : "Research Log | Sangseok Han";

      const description =
        document.querySelector('meta[name="description"]');

      if (description) {
        description.setAttribute(
          "content",
          safeLang === "ja"
            ? "船舶流体力学およびCFDに関する主な研究発表と研究の展開。"
            : "Selected presentations and research development in marine hydrodynamics and CFD."
        );
      }
    }

    function updateNavigationState() {
      const nav = document.querySelector(".nav");

      if (!nav) return;

      nav.classList.toggle(
        "is-scrolled",
        window.scrollY > 24
      );
    }

    document.addEventListener("DOMContentLoaded", () => {
      applyLang(getSessionLang());

      document.querySelectorAll(".lang-switch a").forEach(a => {
        a.addEventListener("click", event => {
          event.preventDefault();

          const selected =
            SUPPORTED_LANGS.has(a.dataset.lang)
              ? a.dataset.lang
              : DEFAULT_LANG;

          sessionStorage.setItem("lang", selected);
          applyLang(selected);
        });
      });

      updateNavigationState();
    });

    window.addEventListener(
      "scroll",
      updateNavigationState,
      {
        passive: true
      }
    );

    window.addEventListener("load", () => {
      document
        .querySelector(".page-content")
        ?.classList.add("loaded");

      updateNavigationState();
    });
