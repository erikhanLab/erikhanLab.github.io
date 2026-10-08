# P2-D architecture — fully source-driven static research site

P2-D completes the structural migration. The deployed site is built entirely from canonical files under `src/` plus static files under `assets/`; no authored root HTML page is a deployment source anymore.

Public URLs, wording, and visual design are preserved. Search policy is intentionally conservative: the Publications index is searchable, while individual publication detail pages are portfolio pages and remain `noindex`.

## Canonical sources

- `src/content/person.json` — researcher identity, profile links, current appointment, and Profile intro data.
- `src/content/site.json` — navigation, footer label, Home featured publication, and site-level presentation data.
- `src/content/publications.json` — bibliographic/publication source of truth for visible portfolio content. It intentionally contains no Google Scholar/Highwire metadata configuration.
- `src/content/routes.json` — all 17 authored routes, navigation state, source renderer, and search-index policy.
- `src/content/generated-pages.json` — mapping for the seven non-publication authored content pages to template/CSS/JS and shared-shell policy.
- `src/pages/*.html` — authored page templates, including Home, Profile, Research, Timeline, Writing, Research Log, Research Interactions, Contact, Archive, and 404.
- `src/styles/pages/*.css` — page-local CSS for the seven large authored content pages.
- `src/scripts/pages/*.js` — page-local browser behavior for those seven pages.
- `src/components/site-shell.mjs` — shared language bootstrap, Header, Nav, Footer, and identity structured-data renderers.
- `src/components/*.html` — Home/Profile reusable fragments.
- `src/publications/<slug>/` — publication-specific abstract, figures, affiliations, editorial blocks, and page CSS.
- `src/templates/publications-index.html` — Publications index template.

Static source files that are copied without authoring logic remain at repository root: `assets/`, `favicon.ico`, `CNAME`, and the Google verification file.

## Route ownership

All 17 authored routes are now source-generated:

1. Home — dedicated Home renderer.
2. Profile — dedicated Profile renderer.
3. Publications index — canonical publication data + template.
4. Seven publication detail pages — canonical bibliographic data + `src/publications/<slug>/` content. These are portfolio detail pages (`noindex, follow`), not hosted scholarly records.
5. Seven authored content pages — Research, Timeline, Writing, Research Log, Research Interactions, Contact, and Archive — `src/pages` + page CSS/JS + declarative shared-shell policy.

There are **no legacy-body or legacy-copy routes**.

## Build flow

```text
src/content/*
+ src/pages/*
+ src/components/*
+ src/styles/pages/*
+ src/scripts/pages/*
+ src/publications/*
+ static assets/files
        ↓
scripts/build.mjs
        ↓
dist/
        ↓
site-audit.mjs + browser JavaScript syntax check
        ↓
GitHub Pages
```

`dist/` is disposable build output and is ignored by Git.

## Shared shell policy

`src/content/generated-pages.json` explicitly declares whether each authored content page uses the shared Header, Nav, and Footer. This allows special pages such as Archive and Contact to keep their intentional custom navigation/footer while still having a single source of truth.

Migration-era marker names (`P2B_*`, `P2C_*`) have been removed from current templates. Shared template markers use stable `SITE_*` names.

## Editing rules

### Researcher identity / appointment / profile links

Edit `src/content/person.json`.

### Navigation / footer / Home selected work

Edit `src/content/site.json`.

### Search/index policy and route ownership

Edit `src/content/routes.json`.

### Publications

Edit bibliographic fields in `src/content/publications.json`. Edit long-form paper material under `src/publications/<slug>/`.

### Authored pages

Edit page markup under `src/pages/`. For pages listed in `src/content/generated-pages.json`, edit page-specific presentation/behavior in the paired `src/styles/pages/` and `src/scripts/pages/` files.

Do **not** recreate root `index.html`, `research/`, `profile/`, `publications/`, `contact/`, or `archive/` snapshots as editable sources. Those URLs are generated only inside `dist/`.

## Commands

```powershell
npm test
npm run preview
npm run sitemap
```

For an existing P2-C checkout receiving the P2-D overlay, run once:

```powershell
npm run migrate:p2d
```

That command first verifies that the replacement `src/` files exist, removes only the known obsolete root snapshots, then runs the complete test/build gate.

## Release gate

`npm test` validates:

- all 17 authored routes are source-generated;
- no legacy/generated root HTML snapshots remain;
- content-page template/CSS/JS ownership is complete;
- shared Header/Nav/Footer output matches component sources where requested;
- visible publication information agrees with canonical publication data;
- publication detail pages are `noindex`, excluded from the sitemap, and contain no `citation_*`/Highwire metadata or `ScholarlyArticle` JSON-LD;
- canonical URLs, robots policy, sitemap membership, local links/assets, H1 semantics, IDs, and structured data remain valid;
- emitted browser JavaScript parses successfully.

`.github/workflows/deploy-pages.yml` runs this same gate and publishes only `dist/`.
