# Move-out release verification — 9 October 2026

Validation used disposable PostgreSQL at `127.0.0.1:55439/estatedesk_moveout_test` and a local application at port 3100. No migrations or test data were applied to the live database.

## Verified locally

- Pending migrations applied successfully, including the empty `Payment.coveredPeriods` default for new cash and deposit-offset payments.
- 359 unit tests, typecheck, and 8 PostgreSQL integration tests pass. Lint passes with 0 errors and 115 warnings.
- Integration coverage includes deposit application, preserved history and receipts, later debt payments without new recurring bills, refund journal reconciliation, simultaneous closeouts/refunds, payment racing handover, and another active lease.
- Chromium lifecycle test passes: itemised PDF report, required handover confirmations, closure, private refund evidence upload/download, refund settlement, vacancy readiness, retained tenant receipt, and denial of another tenant's document access.
- Fixed handover and refund checkboxes shrinking to zero width in narrow layouts.
- Fixed production middleware redirecting authenticated report/proof download links as generic API navigation; added a regression test.
- Handover, refund, and vacancy release navigate back to the canonical workspace after saving so staff see the persisted state.

## Production release verification

- A private PostgreSQL custom-format backup was created and its archive listing checked before migration.
- All three pending migrations were successfully applied to production on 9 October 2026.
- Refund evidence now uses the configured Cloudflare Images account, with `requireSignedURLs=true`. Download stays behind the authenticated application route. The existing token allows signing-key access but denies original exports, so downloads fall back to a short-lived signed delivery request made server-side.
- A synthetic image verified private upload, signed download, and unsigned access denial (403) against the configured Cloudflare account. The image was removed afterward.
- `PAYMENT_PROOF_BUCKET` remains an optional private S3 alternative when Cloudflare Images is not configured. Local private filesystem storage is development-only.

## Reproducing isolated tests

Set `TEST_DATABASE_URL` to a disposable local database with `test` in its name. Integration helpers reject non-local database hosts. Run `npm run test:integration`.

For browser verification, seed with `scripts/qa/seed-move-out.ts` using the React server condition and the web tsconfig, start the application with `DATABASE_URL` and `DIRECT_URL` explicitly pointing to that same local database, and use the same `AUTH_SECRET` for seeding and the application. Set `MOVEOUT_BROWSER_FIXTURE=/tmp/estatedesk-moveout-browser-fixture.json` and run `npx playwright test --config playwright.move-out.config.ts`. The fixture contains test session cookies and must remain private.
