# Pre-Launch Status

This matrix tracks documentation and operational evidence that must be complete before commercial launch. It prevents polished templates from being mistaken for finished work.

Last reviewed: 2026-07-11

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
| QA report (smoke + unit) | Complete | `docs/QA_REPORT.md` (2026-07-10) |
| Payment product rules | Complete (live prod E2E pending) | Combined bills + gateway/manual settlement; verify/manage permission split |
| Plan integrity | Complete | Org cannot self-assign paid plans; upgrade queue on `/platform/billing`; import limits |
| Production readiness UI | Complete | `/platform/system-health` readiness + `npm run production:check` |
| Go-live runbook | Complete | `docs/PRODUCTION_GO_LIVE.md` |
| DB migration health | Complete | `prisma migrate status` up to date (2026-07-10) |
| In-app help links | Complete | Role-scoped protected routes at `/dashboard/{org,tenant,caretaker,landlord}/help` and `/platform/help` |
| Theme coherence | Complete | Shared `ed-dashboard-shell` primitives and tenant/org surface migration |
| Accessibility QA | In progress | Automated baseline in `tests/unit/accessibility-baseline.test.ts`; manual matrix in `docs/ACCESSIBILITY_QA.md` |
| Kenya legal / privacy review | In progress | Counsel packet in `docs/KENYA_LEGAL_TECHNICAL_ALIGNMENT.md`; sign-off pending in `docs/KENYA_LEGAL_REVIEW.md` |
| Backup restore drill | In progress | Backup captured and validated in `docs/RESTORE_DRILL_EVIDENCE.md`; disposable full restore still required |
| Search Console automation | Partial | Manual GSC submission documented; automated workflows not yet in repo |
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
- Status: **Backup validated; full disposable restore still required**
- Owner: Engineering / operations
- Exit criteria: disposable restore drill completed with RPO/RTO evidence and smoke-test sign-off
- Completed so far: `npm run backup:database`, `npm run backup:validate`, enhanced `npm run restore:drill` with JSON evidence output

## Non-blocking but recommended before scale

| Item | Document / location | Status |
| --- | --- | --- |
| External uptime monitoring | `docs/LAUNCH_READINESS.md` | Configure provider + `HEALTHCHECK_ENABLED` |
| Production cron jobs | `.github/workflows/cron.yml` | Enable `PRODUCTION_CRON_ENABLED` |
| Analytics and ads tags | `docs/ENVIRONMENT.md` | Enable only after legal/consent review |
| Integration providers | `docs/INTEGRATION_READINESS.md` | Enable per provider as approved |

## How to update this file

1. Complete the evidence document or workflow
2. Change the status row in this matrix
3. Add date, owner, and link to proof in the evidence doc
4. Remove the item from **Launch blockers** once signed off