# Public mobile verification — 22 October 2026

Target: deployed https://estatedesk.co.ke, not the uncommitted local source. Chromium with touch/mobile emulation, default theme, 844px height and widths 360, 390 and 768. This verifies responsive behavior, not the architectural claim that every component was designed mobile-first.

Subsequent local corrections and regression evidence: [public mobile fixes](fixes/README.md). The deployed observations below remain the original audit; local fixes do not establish deployment.

## Results

29 distinct public/auth URLs covered at all three widths (87 route/width combinations). The initial matrix has 84 attempts; isolated interactions add 12 attempts including three homepage retries and three provider-registration cases. All combinations ultimately rendered with HTTP 200 and no measured document horizontal overflow. No offscreen controls or unnamed form controls were reported in the successful initial cases. Menu bounds/open/Escape passed where the shared menu was present. Register/password-recovery pages without that menu are marked absent, not failed.

The Middle East landing passed at every width. Screenshots of it, pricing, contact and vacancies are included. Contact and Middle East full-page captures were visually reviewed; this is not a visual sign-off of every route.

Isolated checks on home, contact, vacancies and provider registration passed initial focus entry, 18 consecutive Tab steps staying in the navigation dialog, Escape dismissal and focus return at all three widths. Doubling the root font size produced no document overflow on those four routes. Root-font enlargement is a reflow sample, not browser zoom or proof that all text doubled (pixel-sized text can remain unchanged).

## Findings still open

1. **Intermittent homepage navigation readiness:** in the parallel matrix, the menu button remained disabled for the 30-second click timeout at all three widths. The initial sequential 360px run and later isolated tests at all three widths passed. This is an observed intermittent hydration/readiness issue, not a consistent layout failure; investigate cold-load JavaScript/chunk timing before closing it. The raw failures are preserved.
2. **Tablet form text:** at 768px, text inputs/selects are below 16px on register, forgot-password, contact, service providers, stays and vacancies; provider registration independently measured 14px. At 360/390 the sampled text fields measure 16px. This is an iOS focus-zoom risk candidate, requiring Safari confirmation, not a Chromium-observed zoom failure.
3. **Small tap-area candidates:** login recovery/account links, password recovery back link, contact onboarding link, guide back link and some discovery links measure below 24px high. Review spacing and inline exceptions before claiming a WCAG failure; 44px remains a useful comfort target. Native radio/checkbox dimensions and the deliberately clipped skip link are not automatically failures because labels/focus behavior can provide the usable target. See raw data for exact dimensions.

## Limits and remaining verification

No authenticated dashboards, real-device Safari/Android behavior, screen-reader testing, contrast certification, landscape/virtual-keyboard testing, dark-mode matrix, browser 200% zoom or production form submissions. Individual published vacancy/stay/provider detail pages were not covered; one guide article was covered. Public forms were inspected without submission. No product source or production configuration was changed.

## Reproduce

Run from repository root with installed Playwright Chromium:

```sh
node scripts/audit-public-mobile.mjs
node scripts/audit-public-mobile-interactions.mjs
```

Set `AUDIT_BASE_URL` to a different deployment and `AUDIT_OUTPUT_DIR` for artifact storage. Scripts default to production and `/tmp/estatedesk-public-mobile`. Browser launch may require execution outside the filesystem sandbox on macOS. The current matrix script also includes provider registration, which was added after the initial run and verified separately in `interactions.json`.

Evidence: [initial matrix](report.json), [isolated interactions](interactions.json), [Middle East screenshot](property-management-software-middle-east.png), [contact](contact.png), [pricing](pricing.png), [vacancies](vacancies.png).
