# EstateDesk Project Documentation

**Last updated:** 2026-07-10  
**Product:** Multi-tenant property operations SaaS (Kenya-first, multi-market)  
**Primary app:** `apps/web` (Next.js App Router)  
**Private deep system docs (in-app):** `/platform/developer/docs` · source `apps/web/src/lib/platform/system-docs.ts`

---

## Table of Contents

1. [Purpose](#purpose)
2. [Product scope](#product-scope)
3. [Tech stack](#tech-stack)
4. [Architecture (current)](#architecture-current)
5. [Repository layout](#repository-layout)
6. [Core domains](#core-domains)
7. [Billing & payments (current product rules)](#billing--payments-current-product-rules)
8. [Data model (summary)](#data-model-summary)
9. [Multi-tenancy & authorization](#multi-tenancy--authorization)
10. [Developer setup](#developer-setup)
11. [Database & Prisma](#database--prisma)
12. [SEO & public discovery](#seo--public-discovery)
13. [QA & operations](#qa--operations)
14. [Environment variables](#environment-variables)
15. [Deployment](#deployment)
16. [Key paths](#key-paths)
17. [Roadmap notes](#roadmap-notes)

---

## Purpose

EstateDesk is a multi-tenant property operations platform for landlords, property managers, office staff, accountants, caretakers, and tenants.

It centralizes portfolio structure, occupancy, rent and utility billing, payments, issues, inspections, notices, and role-based workspaces — with Kenya-ready workflows (M-Pesa, water meters, caretaker field ops).

---

## Product scope

| Persona | Primary workspace |
| --- | --- |
| Org admin / manager / office / accountant | `/dashboard/org/**` |
| Tenant | `/dashboard/tenant/**` |
| Caretaker | `/dashboard/caretaker/**` |
| Landlord | `/dashboard/landlord/**` |
| Platform admin | `/platform/**` |
| Public / SEO | `/`, `/vacancies/**`, marketing landings, guides |

Major capabilities:

- Organizations, memberships, subscriptions  
- Properties, buildings, units, vacancies  
- Tenants, leases, online lease signing  
- **Combined period bills (rent + water)**, full or partial pay  
- Payment methods: **instant STK gateway** (auto-settle) vs **manual M-Pesa/bank** (org verifies)  
- Meter readings → water bill approval  
- Issues, inspections, move-outs, notices  
- Accounting (org-level), taxes/KRA hooks  
- Notifications (in-app / push / channel fan-out)  
- Platform control plane (kill switches, support access)

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js **16.x** (App Router), React **19.x** |
| Language | TypeScript **5.x** |
| Data | Prisma **7.x** + PostgreSQL (Neon in prod/dev) |
| UI | Tailwind CSS **4.x**, Radix/shadcn patterns, lucide icons |
| Forms | react-hook-form + zod |
| Storage | S3-compatible (`@aws-sdk/client-s3`) |
| Payments | M-Pesa Daraja STK + manual proof + bank/KCB paybill rails |
| Package management | npm **workspaces** monorepo |

---

## Architecture (current)

### Runtime model

**Modular monorepo / modular monolith — not full microservices.**

| Layer | Role |
| --- | --- |
| `apps/web` | **Only primary deployable** — UI + BFF + domain logic |
| `packages/*` | Shared libraries (config, contracts, auth-sdk, db-kit, events) |
| `services/*` | Domain packages: most are **stubs**; **notifications** + **public-vacancy** are **in-process libraries** |
| `prisma/` | **Single shared schema** (one database) |

`npm run dev` / `npm run build` always target `@estatedesk/web`.

Migration path is documented in `docs/architecture/SERVICES.md` (Phase 1 = current).  
**Do not extract more services until product + DB stability are solid.**

### Request flow

1. Browser hits App Router pages under `apps/web/src/app`  
2. Auth session + org/tenant context resolved server-side  
3. Server Actions / route handlers run business logic  
4. Prisma (with Neon pooler adapter) reads/writes Postgres  
5. Side effects: notifications, accounting posts, receipts, webhooks  

### Resilience (2026-07)

- Prisma pool defaults tuned for Neon (small pool)  
- SSL URL normalization (`uselibpqcompat` for `sslmode=require`)  
- Tenant portal context + layout **soft-fail** optional queries on transient DB errors  
- Transient DB **retries** via `@estatedesk/db-kit`  

---

## Repository layout

```text
estatedesk-main/
├── apps/web/                 # Next.js application (source of truth)
│   ├── src/app/              # Routes: marketing, auth, dashboards, API, sitemaps
│   ├── src/components/       # Shared UI
│   ├── src/features/         # Domain actions & feature UI
│   ├── src/lib/              # Prisma, auth, payments, SEO, billing, …
│   ├── public/               # Icons, SW, static assets
│   └── middleware / proxy    # Security & edge concerns
├── packages/                 # Shared packages
├── services/                 # Domain packages (stubs + a few libraries)
├── prisma/                   # schema.prisma + migrations + seed
├── docs/                     # Project docs (this file and siblings)
├── tests/                    # Unit + integration tests
├── scripts/                  # Backup, modularize helpers, QA scripts
└── package.json              # Workspace root
```

Source paths in application code are under **`apps/web/src/...`**. Older docs may say `src/` at repo root; prefer the monorepo paths above.

---

## Core domains

| Domain | Highlights |
| --- | --- |
| Portfolio | Property, Building, Unit, vacancy marketing |
| Occupancy | Tenant (slug URLs), Lease, signatures, move-outs |
| Billing | RentCharge balances; WaterBill `amountPaid`/`balance` |
| Payments | Payment + PaymentAllocation; combined period bills |
| Water ops | MeterReading approval queue; WR refs |
| Field ops | Issues, inspections, caretaker unit scope |
| Accounting | Chart of accounts, journals, accruals (org) |
| Platform | Control center, support access, webhooks log |
| Notifications | Fan-out channels; unread alerts UI |

---

## Billing & payments (current product rules)

### Combined period bill

- Invoice groups **rent + water** for the same `YYYY-MM` into one bill.  
- Tenant may pay **full balance** or a **partial amount**.  
- On verification/settlement, allocation order is **rent (and other lease charges) first, then water**.  

### Pay Now (eCitizen-style)

1. **Pay Now** → `/dashboard/tenant/payments/new?source=period_bill&id=PERIOD&amount=…`  
2. Method chooser:
   - **Instant gateways** (e.g. M-Pesa STK) — bill auto-reduces on success  
   - **Manual M-Pesa / bank** — paste code/SMS; status **pending** until org verifies  
3. Checkout collects phone/code/proof as required by method  

### Settlement modes

| Mode | Methods | Result |
| --- | --- | --- |
| Gateway | `mpesa-stk` (Daraja env required) | STK callback → `settleGatewayPayment` → SUCCESS + VERIFIED + allocate |
| Manual | `manual-mpesa`, `manual-bank`, org paybill/bank catalog | PENDING until org verify action allocates |

Key code:

- `apps/web/src/lib/billing/period-bill.ts`  
- `apps/web/src/lib/ledger.ts` (`allocateCombinedPeriodPayment`)  
- `apps/web/src/lib/payments/settle-payment.ts`  
- `apps/web/src/app/(app)/dashboard/tenant/payments/checkout/**`  
- `apps/web/src/app/api/webhooks/mpesa/route.ts`  

---

## Data model summary

Critical models (see `prisma/schema.prisma`):

- **Identity:** User, UserSession, Membership, Organization  
- **Portfolio:** Property, Building, Unit  
- **Occupancy:** Tenant (`slug`), Lease, LeaseSignature*  
- **Charges:** RentCharge (`amountDue`/`amountPaid`/`balance`/`PARTIAL`)  
- **Water:** MeterReading, WaterBill (`total`/`amountPaid`/`balance`)  
- **Payments:** Payment (`targetType` includes `COMBINED`), PaymentAllocation, Receipt  
- **Ops:** IssueTicket, Inspection, MoveOutNotice, Notification  
- **Platform:** PlatformControl, PlatformWebhookEvent, Subscription  

Indexes emphasize `orgId` + status/period filters for multi-tenant queries.

---

## Multi-tenancy & authorization

- Every business row is **organization-scoped**.  
- Session carries `userId`, `activeOrgId`, platform role.  
- Guards: `requireUserSession`, `requireTenantAccess`, org role checks, caretaker unit allow-lists.  
- Never trust client-supplied org IDs without membership validation.  
- Support access: timed platform cookie for supervised org admin sessions.  

---

## Developer setup

### Prerequisites

- Node.js 20+  
- npm 10+  
- Postgres (local or Neon)  
- git  

### Install & run

```bash
cd /path/to/estatedesk-main
npm install
cp .env.example .env   # if needed — fill secrets
npx prisma generate
npx prisma migrate deploy
npm run seed           # optional demo data
npm run dev            # apps/web on :3000
```

### Scripts (root)

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next dev (webpack) |
| `npm run build` | Prisma generate + Next build |
| `npm run test` | Unit tests |
| `npm run test:integration` | Integration tests |
| `npm run seed` | Seed database |
| `npm run backup:database` | DB dump |

---

## Database & Prisma

- Schema: `prisma/schema.prisma`  
- Migrations: `prisma/migrations/`  
- Client: `apps/web/src/lib/prisma.ts` (PrismaPg adapter)  
- Env: prefer pooler URL; `getDatabaseUrl()` normalizes SSL for Neon  

```bash
npx prisma migrate status
npx prisma migrate deploy
npx prisma generate
```

If a migration was applied manually and Prisma marks it failed, use  
`npx prisma migrate resolve --applied <name>` after verifying schema.

---

## SEO & public discovery

EstateDesk is **index-ready** for public marketing and vacancy discovery.

| Asset | Role |
| --- | --- |
| `/robots.txt` | Allow public; disallow dashboards/API |
| `/sitemap-index.xml` | **Submit this** to Google/Bing |
| `/sitemap.xml` | ~34 core marketing URLs |
| `/sitemap-rental-landings.xml` | 700+ location/category landings |
| `/sitemap-vacancies.xml` | Vacant unit pages |
| `/llms.txt` | LLM/crawler discovery |
| Root layout metadata | Canonical, OG, Twitter, verification tags |
| JSON-LD | Organization, WebSite, SoftwareApplication, FAQ |

**Full indexing** requires Google Search Console / Bing submission — see **`docs/SEO_INDEXING.md`**.

Private app shells use `privatePageMetadata` (`noindex`).

---

## QA & operations

| Doc | Purpose |
| --- | --- |
| `docs/QA_REPORT.md` | Latest smoke + automated QA (2026-07-10) |
| `docs/SEO_INDEXING.md` | SEO checklist + GSC steps |
| `docs/PRE_LAUNCH_STATUS.md` | Launch matrix |
| `docs/OPERATIONS.md` | Ops runbook |
| `docs/production-deploy-checklist.md` | Deploy checklist |
| `SITEMAPS.md` | Sitemap operator guide |

### Quick automated SEO suite

```bash
node --import tsx --test \
  tests/unit/seo.test.ts \
  tests/unit/sitemap-utils.test.ts \
  tests/unit/public-rental-seo.test.ts \
  tests/unit/guides.test.ts \
  tests/unit/accessibility-baseline.test.ts
```

---

## Environment variables

Full reference: **`docs/ENVIRONMENT.md`**.

Critical groups:

- **Database:** `DATABASE_URL`, `DIRECT_URL`  
- **App URL:** `NEXT_PUBLIC_APP_URL` / `APP_URL` (must be production host in prod)  
- **Auth:** `AUTH_SECRET`  
- **M-Pesa Daraja (STK):** `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_CALLBACK_URL`  
- **SEO verification:** `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_BING_SITE_VERIFICATION`  
- **S3 / web-push / WhatsApp:** optional integrations  

Runtime helpers: `packages/config` + `apps/web/src/lib/config/env.ts`.

---

## Deployment

- Vercel (or similar): **Root Directory = `apps/web`**, install from monorepo root.  
- `prisma generate` runs on install/build.  
- Set production env vars; never point public URL to localhost.  
- Apex host preferred: `estatedesk.co.ke` (www redirect configured).  
- Details: `docs/architecture/DEPLOY.md`, `docs/production-deploy-checklist.md`.  

---

## Key paths

| Concern | Path |
| --- | --- |
| Org dashboard | `apps/web/src/app/(app)/dashboard/org/` |
| Tenant dashboard | `apps/web/src/app/(app)/dashboard/tenant/` |
| Tenant payments / checkout | `.../tenant/payments/` |
| Org payment verify | `.../org/payments/_lib/verify-payment-actions.ts` |
| Combined bill helpers | `apps/web/src/lib/billing/period-bill.ts`, `apps/web/src/lib/ledger.ts` |
| Payment method catalog | `apps/web/src/lib/payments/methods-catalog.ts` |
| Prisma client | `apps/web/src/lib/prisma.ts` |
| SEO helpers | `apps/web/src/lib/seo.ts` |
| Sitemaps | `apps/web/src/app/sitemap-*.xml/` |
| Platform control | `apps/web/src/app/(app)/platform/control/` |
| Notifications lib | `services/notifications/src/lib/` |

---

## Roadmap notes

| Priority | Focus |
| --- | --- |
| Now | Product stability, payments E2E, Neon reliability, GSC sitemap submit |
| Next | Workers for cron/notifications; optional payments webhook isolation |
| Later | Real process boundaries only where load/team isolation requires it |

**Not recommended now:** full microservices, DB-per-service, or rewrites of working Next routes into remote APIs without a clear operational need.

---

## Related documentation

| Doc | Description |
| --- | --- |
| `docs/PRODUCT_DOCUMENTATION.md` | Product vision & personas |
| `docs/QA_REPORT.md` | Latest QA results |
| `docs/SEO_INDEXING.md` | SEO & indexing ops |
| `docs/ENVIRONMENT.md` | Env var reference |
| `docs/API.md` | API notes |
| `docs/architecture/SERVICES.md` | Services migration map |
| `SITEMAPS.md` | Sitemap testing & submission |
| `README.md` | Repo entrypoint |

---

*This document reflects the monorepo as of 2026-07-10. Update the date and sections when major domain rules or deploy topology change.*
