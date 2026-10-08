# P3-B — Editorial and scholarly-content quality

P3-B treats the site as a research portfolio rather than a publication repository. It improves factual consistency without changing the visual system or the publication-detail indexing policy.

## Editorial rules

- Canonical publication bibliography lives in `src/content/publications.json`.
- Journal and conference publication/presentation dates in the Academic Timeline must match the canonical month.
- Publication detail pages remain `noindex` portfolio pages and must not emit Scholar-oriented machine metadata.
- Open-access labels are used only when a licence/publisher record supports the claim. A repository manuscript does not automatically make the publisher version open access.
- Future education is described as incoming/admitted until enrolment begins.
- Current appointments must be described consistently across Home, Profile, Research and Contact.
- External collaborators' titles and affiliations are contextual and may become stale; the interactions page says so explicitly.
- Search-facing titles/descriptions are concise and unique. The build rejects drift.
- English/Japanese UI copy authored with `data-en` / `data-ja` must remain paired.

## Verified bibliographic corrections in this pass

- `spatial-variability`: Ocean Engineering 365, Part 2, Article 127352; published 1 Sep 2026.
- `beyond-resistance`: Ocean Engineering 352, Part 2, Article 124462; published 15 Apr 2026; CC BY 4.0.
- `temperature-ittc`: JMSE 13(7), Article 1203; published 20 Jun 2025; CC BY 4.0.
- `naval-roughness`: Ocean Engineering 312, Part 1, Article 119058; published 15 Nov 2024. The former `Open Access (Elsevier)` label was removed because the publisher page is not marked as publisher-open-access; an accepted manuscript is separately available through Strathprints.
- `wec-mpc`: JASNAOE Conference Proceedings 41, pp. 979–983; published 17 Nov 2025; J-STAGE release 26 Jun 2026.
- `fowt-fsi`: MARINE 2025 programme places the contribution on 23 Jun 2025 in Edinburgh.
- `cfd-spatial`: SNH36 presentation date is 15 Jun 2026 in Busan; proceedings remain forthcoming.

## Maintenance

Run:

```powershell
npm test
```

or only the editorial gate:

```powershell
npm run audit:content
```
