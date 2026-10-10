# Mobile-first, full names, and move-out verification

Verified on 10 October 2026 (Africa/Nairobi).

## Changes

- Tenant and organisation headers grow with long names and remain sticky without covering content.
- Displayed tenant, staff, organisation, property, building, and unit names wrap instead of showing ellipses. Names without spaces can wrap safely.
- Shared scrolling rules preserve sticky headers; tenant actions clear the bottom navigation.
- Public pages and portals use the same rounded Lucide icon family, 1.75 stroke weight, and minimum action-icon dimensions. Existing semantic colours and labels remain available.
- Move-out shows final billing and unapplied-credit blockers before submission. Reports open separately so entered costs and notes are preserved.
- Management close-out transactions use a 15-second timeout, matching the lifecycle integration tests.
- Vacant-unit confirmation survives server revalidation after release.
- Move-out PDFs have an EstateDesk and organisation header, full tenant details, aligned bills and settlement amounts, itemised costs, final notes, an authenticated QR link, and numbered pages.
- CI applies migrations to a disposable PostgreSQL service before its public-page browser checks.
- Browser fixtures use clean same-origin documents so development hot reload cannot replace an active fixture.

## Evidence

- 361 unit tests passed, including move-out PDF pagination with long names and 90 itemised costs.
- 8 integration tests passed against a disposable local PostgreSQL database with all repository migrations applied.
- All 32 general mobile browser scenarios passed. The two authenticated move-out scenarios passed on their final isolated rerun.
- Desktop browser suite: 31 passed; the mobile-menu-only check was intentionally skipped.
- Long-name checks cover 320, 360, 390, 768, 1024, and 1440 pixels in light and dark themes, including names without spaces, header/content separation, sticky positioning, and clearance above the tenant dock.
- Icon checks cover uniform stroke weight, at least 3:1 tile contrast, semantic labels, aligned sidebar dimensions, and decorative SVG accessibility attributes.
- Authenticated move-out checks cover cancellation without losing sessions, PDF reports, handover, deposit settlement, private refund proof, unit release, retained receipts, and cross-account download restrictions.
- Repository lint completed with no errors and 117 existing warnings.
- Typecheck and the production build passed.
- Ten live production mobile checks passed across five public routes at 320 and 390 pixels; health and protected-route redirects also passed.

Screenshots are generated under `test-results/` by the corresponding Playwright tests.

## Scope

This verifies the general workflow using synthetic local accounts. No production tenant was moved out during validation. Chromium phone emulation and desktop browsers were tested; native Safari and installed-PWA device checks remain outside this automated evidence.
