# Site diagnostic — 8 October 2026

Scope: current local working tree and root `.env`. No secret values recorded. Configuration findings describe this environment; deployed environment variables were not inspected.

## Confirmed problems

| Area | Finding | Effect |
| --- | --- | --- |
| Queued email notifications | `services/notifications/src/lib/dispatch.ts` has a console-only `sendEmail` stub, followed by a database update to `SENT`. | Email notifications can be reported as sent without contacting an email provider, including in production. |
| Password reset, verification, invitations | `RESEND_API_KEY` and `EMAIL_FROM` are missing. The transactional email helper explicitly requires both. | These email flows cannot deliver with the current configuration. |
| Storage | S3 bucket and explicit access credentials contain placeholders. | S3-backed uploads and downloads cannot work with these values. |
| M-Pesa STK | Required Daraja credentials, shortcode, passkey and callback URL are empty. | STK initiation is unavailable. Manual payment recording is a separate flow and was not exercised. |
| Scheduled jobs | Effective `CRON_SECRET` is empty; it appears twice in `.env`. Production cron authorization rejects requests when it is empty. | Production cron handlers return unauthorized; runtime environment readiness is degraded. |
| WhatsApp and web push | Provider credentials and push keys are empty. | These external delivery channels are unconfigured. |
| Security configuration | `AUTH_SECRET` and `PLATFORM_API_KEYS_PAGE_PASSWORD` contain placeholders. Code accepts nonempty placeholders. | Predictable signing and vault credentials are accepted. The vault password is separate from an admin user's login password. |
| Configuration diagnostics | `getRuntimeEnvReport` checks presence, without rejecting placeholders. | Some unusable settings are reported as configured. |
| Browser test installation | Project Playwright expects Chromium revision 1148; installed cached Chromium is revision 1243. | Default browser tests fail before exercising UI. Installed Google Chrome works through a temporary audit configuration. |

## Verification

- TypeScript: passed.
- Unit tests: 334 passed, zero failures.
- ESLint: zero errors, 115 warnings.
- Database: read-only connection and `SELECT 1` passed. All local migration names are in applied history; zero unresolved failed migrations. This is not a full schema drift check.
- Read-only browser checks: 12 passed, one expected desktop skip, one desktop dark-mode navigation failure. The failed test passed when rerun alone. Covered homepage, login, registration display, pricing, privacy, vacancies, themes, mobile navigation, reduced-height login layout, health response, and unauthenticated tenant redirect.
- Health smoke tests permit a degraded 503 response; their passing result does not prove full runtime readiness.
- Production build: passed outside the sandbox, including TypeScript and all 820 generated pages. The initial sandboxed build remained at compilation and was stopped before retrying.

## Limits

Authenticated business flows, external payments, uploads and actual message delivery were not exercised. Automatic approval review rejected the full browser rerun because it could mutate the configured persistent database. A read-only subset was approved and run. Most other browser suites use component fixtures, so passing those would not establish end-to-end backend correctness.

No application source or `.env` values were changed during diagnosis. Existing unit/property edits were preserved.
