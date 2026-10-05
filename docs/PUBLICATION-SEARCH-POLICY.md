# Publication search policy

The personal site is a researcher portfolio, not a scholarly repository or alternate publisher.

## Intended public search surface

- `/publications/` is indexable and may appear in Google/Bing as the researcher’s publication-list page.
- `/publications/<slug>/` remains directly reachable from the site but is `noindex, follow` and excluded from `sitemap.xml`.
- DOI/publisher/journal pages remain the authoritative public scholarly records.

## Forbidden on publication detail pages

The build/audit gate rejects:

- Highwire/Google Scholar `citation_*` meta tags, including `citation_pdf_url`;
- `bepress_citation_*` bibliographic meta tags;
- PRISM bibliographic meta tags;
- `ScholarlyArticle` JSON-LD;
- route-manifest changes that make individual publication detail pages indexable.

Generic portfolio metadata such as title, description, canonical URL, Open Graph sharing metadata, and visible DOI links is allowed. `og:type` is emitted as `website`, not `article`, on publication detail pages.

## Crawl policy

Do not block publication detail URLs in `robots.txt`. Crawlers must be able to fetch the page to observe the `noindex` directive. Sitemap generation is driven by `src/content/routes.json`, so noindexed detail pages are automatically omitted.

## Google Scholar profile

Linking the researcher’s Google Scholar profile from Home/Profile/Publications is an identity/navigation link only. It does not make this site an alternate scholarly host.
