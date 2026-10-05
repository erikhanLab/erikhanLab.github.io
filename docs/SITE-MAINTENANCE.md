# Academic site maintenance

The site remains hand-authored static HTML. The audit layer exists to catch drift without changing the visual design or requiring a framework.

## Before pushing

Run:

```powershell
npm test
```

The audit checks canonical URLs, search-index policy, one-H1 semantics on indexable pages, local links/assets, Open Graph images, shared analytics loading, publication Highwire/Google Scholar metadata, structured data, and sitemap membership.

## When adding or changing pages

1. Give the page a self-canonical URL matching its real path.
2. Set an explicit robots policy. Use `noindex, follow` for pages that should remain directly accessible but should not be search landing pages.
3. Keep exactly one document-level `h1` on pages intended for indexing.
4. For publication detail pages, keep the visible title/authors/DOI and the `citation_*` metadata consistent.
5. Run `npm run sitemap` after adding/removing a page or changing index policy.
6. Run `npm test` before committing.

## Current search-index policy

Indexable: home, profile, research, academic timeline, publications index, individual publication pages, and the selected writing page.

Not indexed: contact, research log, research interactions, archive, and 404.

`noindex` is not privacy protection. Anything sensitive should not be published at all.
