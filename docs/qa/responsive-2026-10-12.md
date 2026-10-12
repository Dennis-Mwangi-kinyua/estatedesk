# Workspace card audit — 12 October 2026

## Changes

- Overview grids size columns from available content width, including space occupied by navigation.
- Secondary panels stack until wide desktop widths; management pages use full-width sections.
- Platform payments, charges, leases, inquiries and imports provide readable small-screen cards.
- Reports, notifications, staff and settings wrap long values and contain controls within their cards.
- Management actions share theme-aware colors and 44px targets; semantic navigation icons remain SVGs, with decorative emoji accents on cards.

## Verification

- Unit suite: 369 passed.
- ESLint: zero errors; 114 existing warnings.
- Browser suite: 67 passed, 7 skipped; final card/contrast audit additionally passed in both profiles. Desktop Chromium and Pixel 7 Chromium; public pages and representative organisation, platform, tenant and caretaker components.
- New card audit: widths 320, 360, 390, 768, 1024, 1280, 1440 and 1920 in light/dark themes. Tests long names, currency values, unbroken notification text and archive filenames; asserts card/page containment, minimum overview width and readable action-label contrast.
- Seed-dependent financial lifecycle cases require a seeded disposable database and are skipped locally. Fixtures mock server mutations; live authenticated customer records are not modified.
- Production build and TypeScript checked before deployment.

Run the regression with `npx playwright test card-layout-audit --workers=1`.
