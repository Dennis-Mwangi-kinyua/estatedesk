# EstateDesk QA Report

**Date:** 2026-07-10  
**Scope:** Stability pass, public site smoke, SEO indexability, automated unit suites  
**Environment:** Local monorepo (`apps/web`), Next.js 16.2.6, Neon PostgreSQL pooler  

---

## Executive summary

| Area | Result |
| --- | --- |
| Public marketing site | **Pass** — core pages return 200 with indexable meta |
| SEO / sitemaps / robots | **Pass (index-ready)** — submit sitemap in GSC for actual indexing |
| Automated SEO/a11y/guides/PWA unit tests | **Pass** (27 tests) |
| DB migrations | **Pass** — schema up to date after resolve |
| Tenant shell resilience | **Hardened** — soft-fail + retries on transient Neon errors |
| Payment flows (combined bill, gateway vs manual) | **Implemented** — needs authenticated manual E2E when Neon is stable |
| Full microservices cutover | **Out of scope** — modular monorepo Phase 1 only |

---

## 1. Public site smoke (HTTP)

| Path | Status | Notes |
| --- | --- | --- |
| `/` | 200 | Canonical, OG, JSON-LD present |
| `/vacancies` | 200 | Public discovery |
| `/pricing` `/services` `/faq` `/contact` | 200 | `robots=index, follow` |
| `/privacy` `/terms` `/guides` `/register` | 200 | Indexable |
| `/login` | 200 | Public auth |
| `/dashboard/tenant` | 307 | Correctly redirects unauthenticated users |
| `/robots.txt` | 200 | Blocks private prefixes |
| `/sitemap-index.xml` | 200 | 4 child sitemaps |
| `/sitemap.xml` | 200 | ~34 URLs |
| `/sitemap-rental-landings.xml` | 200 | Large set |
| `/llms.txt` | 200 | Discovery list |
| `/manifest.webmanifest` | 200 | PWA |

---

## 2. Automated tests run

```text
accessibility-baseline     pass
guides                     pass (3)
seo                        pass
sitemap-utils              pass (9)
public-rental-seo          pass
pwa                        pass
```

**Total this run:** 27 passed, 0 failed.

---

## 3. Stability / infrastructure

| Item | Status | Action taken |
| --- | --- | --- |
| Prisma migrate history | Fixed | Resolved failed `platform_control`; marked slug + water balance migrations applied |
| Neon `ETIMEDOUT` under load | Mitigated | Soft-fail portal queries, retries, smaller pool (max 5), layout `allSettled` |
| Tenant layout crash on `leaseSignatureSigner` | Mitigated | Soft-fail + empty fallback |
| Combined rent+water bills | Implemented | Period bills, partial pay, allocate on verify |
| Pay Now method chooser | Implemented | STK auto-settle vs manual pending verify |

### Residual risk

- Neon pooler **intermittent timeouts** still appear under concurrent queries; app should degrade gracefully rather than white-screen.  
- Authenticated payment E2E (STK + org verify) not fully automated here — requires live Daraja env + stable DB session.

---

## 4. Payment QA checklist (manual — authenticated)

Use with a seed org + tenant lease + issued water bill for the same period.

| # | Step | Expected |
| --- | --- | --- |
| 1 | Tenant → Invoice | Period shows **Rent + Water** combined card |
| 2 | **Pay Now** | Method chooser: Instant vs Manual |
| 3 | Manual M-Pesa: amount ≤ balance, paste 10-char code | Payment **PENDING** |
| 4 | Org → Payments → Verify | Rent then water balances decrease; receipt issued |
| 5 | Partial amount | Status PARTIAL on open lines; balance reduced only by paid amount |
| 6 | STK (if Daraja configured) | Prompt on phone; webhook auto-settles without org verify |
| 7 | Duplicate code | Rejected / unique constraint message |

---

## 5. SEO QA checklist (operator)

| # | Step | Expected |
| --- | --- | --- |
| 1 | Production `NEXT_PUBLIC_APP_URL=https://estatedesk.co.ke` | Canonicals not localhost |
| 2 | GSC verify domain | Property verified |
| 3 | Submit `https://estatedesk.co.ke/sitemap-index.xml` | Sitemap “Success” |
| 4 | Inspect `/`, `/vacancies`, `/pricing` | Eligible for indexing |
| 5 | Confirm `/dashboard/*` not in sitemap | No private URLs |
| 6 | Bing submit same index | Optional |

Details: `docs/SEO_INDEXING.md`.

---

## 6. Architecture decision (current)

**Do not full-cut to microservices yet.**  
Runtime remains **one Next app + one Postgres**. Services packages are mostly stubs; notifications/public-vacancy are in-process libraries. See `docs/architecture/SERVICES.md`.

---

## 7. Sign-off

| Role | Sign-off | Date |
| --- | --- | --- |
| Engineering (this report) | Automated + smoke completed | 2026-07-10 |
| Product / ops payment E2E | Pending live session | — |
| GSC indexing submit | Pending production operator | — |
| Legal (privacy/terms) | See PRE_LAUNCH_STATUS | — |

---

## Related docs

- `docs/PROJECT_DOCUMENTATION.md` — full technical project doc  
- `docs/SEO_INDEXING.md` — SEO & indexing  
- `docs/PRE_LAUNCH_STATUS.md` — launch matrix  
- `SITEMAPS.md` — sitemap operator guide  
- `docs/architecture/SERVICES.md` — monorepo → services phases  
