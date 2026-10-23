# Pre-Launch Status

This matrix tracks documentation and operational evidence that must be complete before commercial launch. It prevents polished templates from being mistaken for finished work.

Last reviewed: 2026-10-22

Current engineering evidence: [22 October gap review](audits/2026-10-22/README.md), [21 October SEO review](audits/2026-10-21/README.md), and [17 October review](audits/2026-10-17/README.md). External approvals and deployed-account state remain unverified unless linked below.

## Summary

| Area | Status | Evidence |
| --- | --- | --- |
| Developer onboarding | Complete | `README.md`, `docs/PROJECT_DOCUMENTATION.md`, `docs/ENVIRONMENT.md` |
| Product documentation | Complete | `docs/PRODUCT_DOCUMENTATION.md` |
| Technical project documentation | Complete | `docs/PROJECT_DOCUMENTATION.md` (monorepo, payments, architecture Phase 1) |
| Public guides and SEO content | Complete | `/guides`, tests in `tests/unit/guides.test.ts` |
| SEO indexability (code) | Complete | `docs/SEO_INDEXING.md`; sitemaps/robots/meta verified 2026-07-10 |
| Search Console submission | Operator pending | Submit `https://estatedesk.co.ke/sitemap-index.xml` in GSC/Bing |
| API reference | Complete | `docs/API.md` |
| Operations runbook | Complete | `docs/OPERATIONS.md`, `docs/production-deploy-checklist.md` |
| Sitemap documentation | Complete | `SITEMAPS.md`, `docs/SEO_INDEXING.md` |
| QA evidence | Current review recorded | `docs/audits/2026-10-22/README.md`: 641 tests and local realtime transaction integration passed; manual authenticated/device QA remains pending |
| Payment product rules | Complete (live prod E2E pending) | Combined bills + gateway/manual settlement; verify/manage permission split |
| Plan integrity | Complete | Org cannot self-assign paid plans; upgrade queue on `/platform/billing`; import limits |
| Production readiness UI | Complete | `/platform/system-health` readiness + `npm run production:check` |
| Workspace live updates | Deployed; signed-in smoke test pending | `docs/REALTIME.md`; 69 table triggers installed, direct listener connection configured, anonymous route rejection verified |
| Go-live runbook | Complete | `docs/PRODUCTION_GO_LIVE.md` |
| DB migrations | Production up to date (22 October 2026) | All 87 migrations applied; realtime migration recovered with base-table filtering and reverified after a validated private backup |
| In-app help links | Complete | Role-scoped protected routes at `/dashboard/{org,tenant,caretaker,landlord}/help` and `/platform/help` |
| Theme coherence | Complete | Shared `ed-dashboard-shell` primitives and tenant/org surface migration |
| Accessibility QA | In progress | Automated baseline in `tests/unit/accessibility-baseline.test.ts`; manual matrix in `docs/ACCESSIBILITY_QA.md` |
| Kenya legal / privacy review | In progress | Counsel packet in `docs/KENYA_LEGAL_TECHNICAL_ALIGNMENT.md`; sign-off pending in `docs/KENYA_LEGAL_REVIEW.md` |
| Backup restore drill | Local drill complete; off-site retention pending | Actual restores recorded on 13 and 17 October; `docs/RESTORE_DRILL_EVIDENCE.md` |
| Search Console automation | Implemented; account connection pending | `.github/workflows/sitemap-ping.yml`, `scripts/submit-sitemaps.mjs`; successful submission needs verified property credentials |
| Full microservices cutover | Not started (by design) | Modular monorepo Phase 1 — `docs/architecture/SERVICES.md` |

## Launch blockers

### Accessibility QA

- Document: `docs/ACCESSIBILITY_QA.md`
- Status: **Automated baseline complete; manual authenticated QA still required**
- Owner: Product / QA
- Exit criteria: keyboard, screen-reader, contrast, zoom, and reduced-motion checks signed off at 360px, 390px, 768px, and desktop
- Completed so far: skip link, login alert/labels, reduced-motion CSS, CI baseline tests

### Kenya legal and privacy review

- Document: `docs/KENYA_LEGAL_REVIEW.md`
- Status: **Technical alignment ready; qualified counsel sign-off still required**
- Owner: Legal / compliance
- Exit criteria: privacy notice, terms, DPA, retention, M-Pesa/bank processing, and ODPC obligations reviewed and approved
- Completed so far: subprocessors, DSR, and incident sections added to `/privacy`; technical alignment memo published

### Backup restore drill

- Document: `docs/RESTORE_DRILL_EVIDENCE.md`
- Status: **Local restore completed; off-site encrypted retention and recurring recovery evidence still required**
- Owner: Engineering / operations
- Exit criteria: production backup retention/location approved, scheduled backup success verified, and recurring restore with application smoke-test evidence
- Completed so far: actual disposable restores on 13 and 17 October, checksum verification and JSON timing/row-count evidence. A local test restore does not establish a production recovery SLA.

## Non-blocking but recommended before scale

| Item | Document / location | Status |
| --- | --- | --- |
| External uptime monitoring | `.github/workflows/uptime.yml` | 15-minute workflow implemented; deployed runs and alert receipt need operator verification |
| Background jobs | Platform manual controls | Tenant-credit cron remains scheduled; native push requires regular Notifications job execution |
| Analytics and ads tags | `docs/ENVIRONMENT.md` | Enable only after legal/consent review |
| Integration providers | `docs/INTEGRATION_READINESS.md` | Enable per provider as approved |

## How to update this file

1. Complete the evidence document or workflow
2. Change the status row in this matrix
3. Add date, owner, and link to proof in the evidence doc
4. Remove the item from **Launch blockers** once signed off
## Mobile release

Core native workflows are implemented; see `apps/mobile/README.md`. Expo/store accounts, APNs/FCM credentials, final store assets/disclosures, physical-device checks, and mobile dependency advisories remain release gates. No store submission has been made.
