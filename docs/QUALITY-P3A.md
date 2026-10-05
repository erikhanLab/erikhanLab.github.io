# Quality hardening · P3-A

P3-A improves the existing design without changing the site's editorial content or search-exposure policy.

## Accessibility foundation

- Every authored route has exactly one `main` landmark and one `h1`.
- Every authored route has a keyboard-visible “Skip to main content” link.
- Primary navigation uses semantic `<nav>` markup.
- Shared navigation, language controls, and footer controls have visible keyboard focus treatment.
- Reduced-motion preferences disable non-essential transitions and animation timing.
- Every `img` has alt text (including deliberate empty alt for redundant/decorative images), intrinsic width/height, and asynchronous decoding.

## Performance foundation

- The former 20.9 MB and 9.1 MB animated GIFs are delivered as WebM with MP4 fallbacks and poster images.
- Motion video uses `preload="none"`; it loads on interaction rather than as an eager image payload.
- Home/Profile/Contact portrait imagery provides WebP sources with the original PNG retained as fallback.
- `favicon-32.png` is a real 32×32 asset rather than a 1254×1254 image labeled as a favicon.
- Research Log and Archive galleries lazy-load below-the-fold images.
- Publication figures lazy-load and carry intrinsic dimensions.
- The production build explicitly excludes the obsolete GIF files even before optional source cleanup.

## Automated gate

`npm test` now runs `scripts/quality-audit.mjs` in addition to the existing source, exposure, link, asset, and JavaScript checks.

The quality audit fails if a route loses its main landmark, skip link, single H1, image alt/dimensions, safe `_blank` rel attributes, reduced-motion support, optimized video delivery, or true 32px favicon.

## Optional one-time source cleanup

After applying the P3-A overlay, run:

```powershell
npm run cleanup:quality
```

This first verifies the WebM/MP4/poster replacements, then deletes only:

- `assets/research/fowt-pitch.gif`
- `assets/research/wec-cfd-mbd.gif`

The build already excludes these obsolete files from `dist/`, so cleanup is safe but not required for deployment correctness.
