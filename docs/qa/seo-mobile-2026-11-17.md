# SEO, feature coverage and mobile verification — 17 November 2026

Local source verification only; no deployment or search-account submission was performed.

## Delivered

- `/features`: 17 source-backed feature areas, visible release qualifications, self-canonical metadata and matching ItemList JSON-LD.
- Shared product inventory for the catalogue, SoftwareApplication feature names and `/llms.txt`; linked through home/services/footer and the public sitemap manifest.
- `/basic.html`: 2,946-byte uncompressed static overview; no JavaScript, images, web fonts or external stylesheets. Deliberately `noindex,follow`.
- Shared mobile sizing, wrapping, viewport fallback and reduced-motion/transparency rules.
- Operational SEO procedure, feature catalogue and mobile support/acceptance documentation.

## Completed checks

- Web TypeScript: passed.
- SEO, sitemap utilities, public rental SEO and guide unit test files: passed.
- `features-mobile-seo.spec.ts`: all three scenarios passed in Chromium. Server content/JSON-LD works with JavaScript disabled; `/features` appears in the sitemap and discovery text. Home/features/pricing/contact fit 320, 360, 390, 768 and 1440 CSS pixels. Features also fit at 200% root text sizing. Basic overview fits at 240 pixels and requests no script/image/font/stylesheet resources.
- `git diff --check`: passed.
- Existing public mobile navigation and SEO metadata suites: all five scenarios passed, including no-JavaScript navigation, focus trapping/restoration, tablet form sizing, public actions in both themes, canonical metadata, sharing image and private crawl exclusions.
- Production compilation and build TypeScript validation passed with `NODE_OPTIONS=--max-old-space-size=4096 npm run build`. The default 2 GB TypeScript worker exhausted its heap. The retried build was stopped during static page generation after repeated missing-column errors and database timeouts; a complete production build and release fingerprint were not verified for this revision.

## Environment finding and limits

The broader public navigation run logged vacancy query failures because the configured database lacks the expected `blacklistedAt` column (`P2022`); a related source migration exists at `prisma/migrations/20261110200000_organization_blacklist/migration.sql`. It also logged database query timeouts. No database migration was applied as part of this source/content task. Layout success does not establish listing-data correctness.

Current Chromium emulation does not establish compatibility with the minimum supported browser engines or historical phones. Real low-memory devices, Safari, TalkBack/VoiceOver, hardware permissions, poor networks, authenticated workflows and production field performance still require acceptance. The basic page broadens public access; it is not a legacy-browser implementation of the secure dashboard.
