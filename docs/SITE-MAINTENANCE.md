# Academic site maintenance — P2-D

The repository is now fully source-driven. Treat `src/`, `assets/`, and the small set of static verification files as authoritative. `dist/` is generated output only.

## Before pushing

Run:

```powershell
npm test
```

A release is valid only when the source ownership check, build, final-site audit, and browser-JavaScript syntax check all pass.

For a P2-C repository receiving the P2-D overlay, use this once instead:

```powershell
npm run migrate:p2d
```

It safely removes obsolete root snapshots and then runs `npm test`.

## Where to edit

- Identity/current appointment/profile links/email: `src/content/person.json`
- Navigation/footer/Home featured publication/last-updated data: `src/content/site.json`
- Publication bibliography/presentation metadata: `src/content/publications.json`
- Search/index/source policy for every route: `src/content/routes.json`
- Large authored page template/CSS/JS mapping: `src/content/generated-pages.json`
- Page markup: `src/pages/*.html`
- Page-specific styling: `src/styles/pages/*.css`
- Page-specific behavior: `src/scripts/pages/*.js`
- Shared Header/Nav/Footer/language bootstrap: `src/components/site-shell.mjs`
- Home/Profile fragments: `src/components/*.html`
- Publication abstract/figures/page-specific material: `src/publications/<slug>/`

There is no second editable HTML tree at repository root.

## Search policy

`src/content/routes.json` is the route-level source of truth.

Indexable: Home, Profile, Research, Academic Timeline, Publications index, and the selected Writing page.

Not indexed: all seven individual publication detail pages, Contact, Research Log, Research Interactions, Archive, and 404.

Publication detail pages are deliberately treated as researcher-portfolio pages, not scholarly-hosting records. They must not emit Highwire/Google Scholar `citation_*` metadata, `bepress_citation_*`, PRISM bibliographic tags, `citation_pdf_url`, or `ScholarlyArticle` JSON-LD. The official DOI/publisher/journal remains the authoritative scholarly record. Keep these pages crawlable so crawlers can observe `noindex`; do not block them in `robots.txt`.

`noindex` is not privacy protection. Sensitive content should not be published.

## Local preview

```powershell
npm test
npm run preview
```

Then open `http://localhost:4173`.

## Sitemap

The normal build writes `dist/sitemap.xml`. To regenerate only the sitemap from the route manifest:

```powershell
npm run sitemap
```
