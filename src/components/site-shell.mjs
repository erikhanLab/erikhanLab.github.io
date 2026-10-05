const esc = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");


export function renderLanguageBootstrap() {
  return `<script>
    (function () {
      const savedLang = sessionStorage.getItem("lang");
      const lang = savedLang === "ja" ? "ja" : "en";
      document.documentElement.setAttribute("lang", lang);
      document.documentElement.setAttribute("data-lang", lang);
    })();
  </script>`;
}

export function renderStandardHeader(person) {
  return `<header class="site-header">
    <div class="site-header-row">
      <a href="/" class="site-name">${esc(person.name)}</a>
      <div class="lang-switch" role="group" aria-label="Language selection">
        <a href="#" data-lang="en">EN</a>
        <span aria-hidden="true">·</span>
        <a href="#" data-lang="ja">JP</a>
      </div>
    </div>
  </header>`;
}

export function renderStandardNav(site, activeKey) {
  const links = site.navigation.map((item) => {
    const active = item.key === activeKey ? ' class="active" aria-current="page"' : "";
    return `    <a href="${esc(item.href)}" data-en="${esc(item.en)}" data-ja="${esc(item.ja)}"${active}>${esc(item.en)}</a>`;
  }).join("\n");
  return `<nav class="nav" aria-label="Primary">\n${links}\n  </nav>`;
}

export function renderStandardFooter(person, site) {
  return `<footer class="site-footer">
    <div class="footer-signature">
      <span class="footer-name">${esc(person.name)}</span>
      <span class="footer-field" data-en="${esc(site.footerField.en)}" data-ja="${esc(site.footerField.ja)}">${esc(site.footerField.en)}</span>
    </div>
    <a class="footer-top" href="#top">
      <span data-en="Back to top" data-ja="ページ上部へ">Back to top</span>
      <span class="footer-top-arrow" aria-hidden="true">↑</span>
    </a>
  </footer>`;
}

export function homeJsonLd(person) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${person.site}/#website`,
        url: `${person.site}/`,
        name: person.name,
        publisher: { "@id": `${person.site}/#person` },
      },
      {
        "@type": "Person",
        "@id": `${person.site}/#person`,
        name: person.name,
        url: `${person.site}${person.profilePath}`,
        image: `${person.site}${person.image}`,
        sameAs: [person.profiles.googleScholar, person.profiles.orcid, person.profiles.linkedin],
        knowsAbout: person.knowsAbout,
      },
    ],
  };
}

export function profileJsonLd(person) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: `${person.site}${person.profilePath}`,
    mainEntity: {
      "@type": "Person",
      "@id": `${person.site}/#person`,
      name: person.name,
      url: `${person.site}${person.profilePath}`,
      image: `${person.site}${person.image}`,
      jobTitle: person.currentAppointment.role.en,
      affiliation: {
        "@type": "Organization",
        name: person.currentAppointment.schemaAffiliation,
      },
      sameAs: [person.profiles.googleScholar, person.profiles.orcid, person.profiles.linkedin],
    },
  };
}
