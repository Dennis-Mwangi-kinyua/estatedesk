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

## Follow-up: reviews, dark theme and documents

- Notice review cards now have a full-width queue, adaptive columns, tenant/contact details, dates, balance breakdowns, next steps and expandable settlement controls.
- Inspection details use contained overview cards, report sections and consistent actions. Date formatting explicitly uses Africa/Nairobi.
- Dark workspace text and boundaries have stronger contrast; semantic icon tiles retain their sky/mint/peach/violet colors.
- Shared PDF layout measures text width, wraps long words, paginates tables, repeats headings and adds page numbers. Standard receipts fit one A4 page; long receipts and invoices retain every allocation/charge.
- Lease agreements retain custom titles and clauses with clearer financial sections and signature fields. Verification certificates append to the original contract pages.
- Reproduced tribunal export failure: Helvetica could not encode the literal arrow in the lease-date line. The new renderer safely represents unsupported characters as Unicode codes, including emoji in notification evidence.
- Existing receipt hashes retain the frozen version-one renderer; new/unhashed snapshots use version two. No migration or production-record rewrite is required.
- Document regressions cover all allocations/charges, continued-page bounds, Unicode evidence, retained source contract pages, custom terms and a golden hash for old receipts. Follow-up validation: 376 unit tests and 67 browser tests passed; seven database/device-dependent browser cases skipped. Lint has no errors. Standard receipt, invoice and lease samples were visually inspected.
