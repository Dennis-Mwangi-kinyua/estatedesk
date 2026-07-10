# EstateDesk

**Multi-tenant property operations SaaS** for landlords, property managers, office staff, accountants, caretakers, and tenants — built Kenya-first (M-Pesa, water meters, caretaker field work), usable across East Africa and global rental markets.

EstateDesk is an **operating system for rental revenue, service, and accountability**: portfolio structure, occupancy, **combined rent + water billing**, payments (M-Pesa STK + manual proof), issues, inspections, notices, accounting, documents/receipts, notifications, public vacancy SEO, and a platform control plane — in one secure product.

| | |
| --- | --- |
| **Primary app** | `apps/web` (Next.js 16 App Router) |
| **Database** | PostgreSQL via Prisma 7 (Neon pooler–friendly) |
| **Architecture** | Modular monorepo / modular monolith (not full microservices yet) |
| **Public surface** | Marketing, vacancies, guides, SEO sitemaps, `llms.txt` |
| **Private workspaces** | Org · tenant · caretaker · landlord · platform admin/developer |
| **Private system docs** | `/platform/developer/docs` (platform admins only) |

---

## Table of contents

1. [What is EstateDesk?](#what-is-estatedesk)
2. [Who uses it](#who-uses-it)
3. [Feature map](#feature-map)
4. [Architecture](#architecture)
5. [Repository structure](#repository-structure)
6. [Tech stack](#tech-stack)
7. [Getting started](#getting-started)
8. [Environment variables](#environment-variables)
9. [Database & Prisma](#database--prisma)
10. [Domain deep dives](#domain-deep-dives)
11. [Personas, routes & shells](#personas-routes--shells)
12. [Payments & billing (product rules)](#payments--billing-product-rules)
13. [Water metering pipeline](#water-metering-pipeline)
14. [Notifications](#notifications)
15. [SEO & indexing](#seo--indexing)
16. [Platform control plane](#platform-control-plane)
17. [Platform developer docs (private)](#platform-developer-docs-private)
18. [Security model](#security-model)
19. [Testing & QA](#testing--qa)
20. [Deployment](#deployment)
21. [Scripts reference](#scripts-reference)
22. [Documentation map](#documentation-map)
23. [Contributing](#contributing)
24. [License & product context](#license--product-context)

---

## What is EstateDesk?

EstateDesk lets a **property organization** run day-to-day operations without spreadsheets:

- Structure **properties → buildings → units**
- Place **tenants** on **leases**, collect rent and utilities
- Run **field ops** (caretaker meter reads, issues, inspections)
- Accept **M-Pesa** (STK auto-settle or manual proof pending verification)
- Keep **org staff**, **accountants**, **landlords**, and **tenants** in role-scoped workspaces
- Expose **public vacancies** for SEO and discovery
- Give **platform operators** kill switches, support access, health, jobs, and deep system docs

**Public discovery** (vacancies, landings, guides) sits next to **authenticated workspaces** that are never sitemapped and use `noindex`.

---

## Who uses it

| Persona | Workspace | Typical work |
| --- | --- | --- |
| **Org ADMIN / MANAGER** | `/dashboard/org` | Portfolio, staff, settings, approvals |
| **OFFICE** | `/dashboard/org` | Tenants, issues, day-to-day ops |
| **ACCOUNTANT** | `/dashboard/org` | Payments queue, accounting, reports |
| **Tenant** | `/dashboard/tenant` | Bills, Pay Now, issues, lease, notices |
| **Caretaker** | `/dashboard/caretaker` | Unit-scoped meters, issues, inspections |
| **Landlord** | `/dashboard/landlord` | Owner-facing portfolio views |
| **Platform admin** | `/platform` | Orgs, users, billing, onboarding, messages |
| **Platform engineering** | `/platform/developer` | Health, APIs, flags, jobs, **System Docs** |
| **Public visitor** | `/`, `/vacancies`, marketing | SEO landings, vacancy discovery |

Keyboard (platform shell): **`Alt+Shift+A`** → Admin mode · **`Alt+Shift+D`** → Developer mode.

---

## Feature map

### Portfolio & occupancy
- Multi-org tenancy with memberships and RBAC  
- Properties, buildings, units, vacancy publishing  
- Tenants (slug-friendly IDs where used), leases, e-sign envelopes  
- Move-outs, inspections, notices  

### Billing & payments
- **Combined period bills** (rent + water on one card for `YYYY-MM`)  
- Full or **partial** payment amounts  
- Allocation: **rent lines first, then water**  
- **Pay Now** → method chooser (eCitizen-style):  
  - **Instant gateway** (M-Pesa STK) → auto-settles bill on success  
  - **Manual M-Pesa / bank** → paste code/SMS → **PENDING until org verifies**  
- Receipts, org payment queue, reconciliation hooks, KCB paybill IPN  

### Field operations (caretaker)
- Unit-scoped issues, meter capture (offline-capable), inspections  
- Photo evidence, handover notes, vendor dispatch  

### Accounting (org-level)
- Chart of accounts, journals, periods, budgets  
- Payment posting, receivables, owner statements  
- Period close / year-end close policies  

### Platform control plane
- Admin mode: orgs, users, billing, onboarding, messages  
- Developer mode: health, APIs, jobs, flags, rate limits, backups, **system docs**  
- Super-admin website control (kill switches, nuclear ops, support access)  

### Public / SEO
- Marketing pages, FAQ, pricing, market landings  
- Vacancy discovery + multi-sitemap index + `llms.txt`  
- JSON-LD and canonical metadata  

---

## Architecture

### Current (Phase 1) — modular monorepo / modular monolith

```text
                         ┌─────────────────────────┐
                         │   Browser / PWA client  │
                         └───────────┬─────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────┐
│  apps/web  (Next.js 16 — ONLY primary deployable)          │
│  · App Router pages & layouts                              │
│  · Server Actions + API routes + webhooks + cron           │
│  · Domain logic in src/lib + src/features                  │
└────────────┬───────────────────────────┬───────────────────┘
             │                           │
             ▼                           ▼
   packages/* (shared libs)     services/* (domain packages)
   config, contracts,           mostly stubs; exceptions:
   db-kit, auth-sdk,            notifications + public-vacancy
   events, service-client       are real in-process libraries
             │
             ▼
   prisma/  ──►  ONE PostgreSQL database (Neon-friendly)
```

| Layer | Role |
| --- | --- |
| `apps/web` | **Only primary deployable** — UI + BFF + domain logic |
| `packages/*` | Shared TypeScript libraries (env, contracts, retry, events) |
| `services/*` | Domain packages — **stubs** unless noted (notifications, public-vacancy) |
| `prisma/` | Single shared schema + migrations for all domains |

**Not full microservices.** See `docs/architecture/SERVICES.md` for extraction phases. Prefer product stability over service sprawl.

### Request lifecycle (simplified)

1. Browser hits App Router page, Server Action, or API route under `apps/web`  
2. Middleware / proxy applies security headers and rate limits  
3. Layouts / handlers call guards (`requireUserSession`, `requirePlatformRole`, `requireTenantAccess`, org role checks)  
4. Handlers use Prisma via `apps/web/src/lib/prisma.ts` (PrismaPg adapter, conservative pool for Neon)  
5. Side effects run in-process: notifications, accounting posts, receipts, document registry  
6. External callbacks: M-Pesa STK webhook auto-settles gateway payments  

### Where code should live

| Kind of change | Put it here |
| --- | --- |
| New UI route | `apps/web/src/app/(app)/dashboard/{role}/…` |
| Mutation / form action | `apps/web/src/features/*/actions` or colocated `actions.ts` |
| Cross-cutting domain logic | `apps/web/src/lib/{domain}` |
| Shared pure helper for packages | `packages/*` |
| Future extractable domain | `services/{name}` (library first, then network) |

**Rule:** every business query must be **org-scoped** (filter by `orgId` + membership).

---

## Repository structure

```text
estatedesk-main/
├── apps/
│   └── web/                      # Next.js application (@estatedesk/web)
│       ├── src/app/              # Routes (marketing, auth, dashboards, API, SEO)
│       ├── src/components/       # Shared UI (layout, marketing, PWA, theme, …)
│       ├── src/features/         # Domain actions & feature modules
│       ├── src/lib/              # Prisma, auth, payments, SEO, billing, …
│       ├── public/               # Icons, service worker, static assets
│       ├── middleware.ts
│       ├── next.config.ts
│       └── package.json
├── packages/                     # Shared packages
│   ├── auth-sdk/
│   ├── config/                   # Env + Neon SSL URL helpers
│   ├── contracts/                # Zod DTOs + event names
│   ├── db-kit/                   # Transient DB retry helpers
│   ├── events/                   # In-process bus / outbox interface
│   └── service-client/           # HTTP client stub for future services
├── services/                     # Domain packages (stubs + libraries)
│   ├── notifications/            # Real library (notifyRecipients, dispatch)
│   ├── public-vacancy/           # Real library (listings, sitemaps)
│   └── accounting, auth, …       # Stubs until extraction
├── prisma/
│   ├── schema.prisma             # Full data model
│   ├── migrations/
│   └── seed.ts
├── docs/                         # Project, product, SEO, QA, ops docs
│   ├── PROJECT_DOCUMENTATION.md
│   ├── PRODUCT_DOCUMENTATION.md
│   ├── SEO_INDEXING.md
│   ├── QA_REPORT.md
│   ├── ENVIRONMENT.md
│   ├── architecture/
│   └── …
├── tests/                        # Unit + integration tests
├── scripts/                      # Backup, load test, modularize, QA helpers
├── extensions/                   # Browser extension packaging
├── package.json                  # Workspace root
├── prisma.config.ts
├── vercel.json
└── README.md                     # This file
```

Application source for product features lives under **`apps/web/src/...`**.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | **Next.js 16** (App Router), **React 19** |
| Language | **TypeScript 5** |
| Data | **Prisma 7** + **PostgreSQL** (Neon pooler supported) |
| UI | **Tailwind CSS 4**, Radix / shadcn patterns, Lucide |
| Forms | react-hook-form + **zod** |
| Motion | framer-motion |
| Charts | recharts |
| Storage | AWS S3-compatible (`@aws-sdk/client-s3`) |
| Payments | M-Pesa Daraja STK + manual proof · KCB paybill/IPN hooks |
| Push | web-push |
| PDF | pdf-lib |
| Package manager | npm workspaces |

---

## Getting started

### Prerequisites

- **Node.js 20+**  
- **npm 10+**  
- **PostgreSQL** (local or Neon)  
- git  

### Install

```bash
cd /path/to/estatedesk-main
npm install
```

`postinstall` runs `prisma generate`.

### Configure environment

```bash
cp .env.example .env   # if present; otherwise create .env at repo root
```

`apps/web/.env` is typically a symlink to the root `.env`.

### Minimum env

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection (prefer Neon **pooler**) |
| `DIRECT_URL` | Direct/migrate URL when required by Prisma |
| `NEXT_PUBLIC_APP_URL` / `APP_URL` | Canonical public URL (never localhost in prod) |
| `AUTH_SECRET` | Session signing |
| `CRON_SECRET` | Protects `/api/cron/*` routes |

Optional: M-Pesa Daraja keys, S3, web-push VAPID, Google/Bing site verification.  
Full list: **`docs/ENVIRONMENT.md`**.

### Database

```bash
npx prisma generate
npx prisma migrate deploy
npm run seed    # optional demo data
```

### Run

```bash
npm run dev     # http://localhost:3000 — apps/web
```

### Build / production start

```bash
npm run build
npm run start
```

### Lint / typecheck

```bash
npm run lint
npm run typecheck
# or: npm run typecheck -w @estatedesk/web
```

---

## Environment variables

Runtime helpers: `packages/config` and `apps/web/src/lib/config/env.ts`.

**SSL note (Neon):** `getDatabaseUrl()` sets `uselibpqcompat=true` when `sslmode=require` so node-pg does not hang on `verify-full`.

**Pool defaults** (`apps/web/src/lib/prisma.ts`):

| Env | Default | Meaning |
| --- | --- | --- |
| `PRISMA_POOL_MAX` | `5` | Max pool connections (Neon-safe) |
| `PRISMA_CONNECTION_TIMEOUT_MS` | `20000` | Connect timeout |
| `PRISMA_IDLE_TIMEOUT_MS` | `20000` | Idle timeout |
| `PRISMA_QUERY_TIMEOUT_MS` | `30000` | Query timeout |

**Production SEO:** never set `NEXT_PUBLIC_APP_URL` to localhost — sitemaps and canonicals would break search.

### M-Pesa (STK auto-clear)

| Variable | Purpose |
| --- | --- |
| `MPESA_CONSUMER_KEY` | Daraja consumer key |
| `MPESA_CONSUMER_SECRET` | Daraja consumer secret |
| `MPESA_SHORTCODE` | Business shortcode |
| `MPESA_PASSKEY` | STK passkey |
| `MPESA_CALLBACK_URL` | Public HTTPS callback (must reach prod) |
| `MPESA_CALLBACK_SECRET` | Optional query secret on webhook |
| `MPESA_ENVIRONMENT` | `sandbox` or `production` |

---

## Database & Prisma

| Path | Role |
| --- | --- |
| `prisma/schema.prisma` | Full data model |
| `prisma/migrations/` | Migration history |
| `prisma/seed.ts` | Seed script |
| `apps/web/src/lib/prisma.ts` | Client + pool defaults (Neon-safe) |
| `apps/web/src/lib/db/retry.ts` | Transient retry helpers |
| `packages/db-kit` | Shared retry utilities |

```bash
npx prisma migrate status
npx prisma migrate deploy
npx prisma generate
npx prisma studio          # optional GUI
```

If a migration was applied outside Prisma and deploy fails:

```bash
npx prisma migrate resolve --applied <migration_name>
```

Only after verifying the DB already has the objects.

### Core entity groups (mental model)

| Group | Examples |
| --- | --- |
| Identity | `User`, `UserSession`, password reset / verify |
| Tenancy | `Organization`, `Membership`, `Subscription`, `OrganizationSettings` |
| Portfolio | `Property`, `Building`, `Unit` |
| Occupancy | `Tenant`, `Lease`, lease signature envelope/signer/event |
| Money | `RentCharge`, `WaterBill`, `Payment`, `PaymentAllocation`, `TaxCharge` |
| Field | `MeterReading`, `IssueTicket`, `Inspection`, move-out notices |
| Trust | `DocumentRecord`, `Receipt`, audit logs |
| Comms | `Notification`, push subscriptions |
| Platform | `PlatformControl`, `PlatformWebhookEvent`, API keys, cron runs |

---

## Domain deep dives

In-product private write-ups (platform admin only) live at **`/platform/developer/docs`**. Summary for contributors:

### Combined period billing
- Product construct over `RentCharge` + `WaterBill` for the same `YYYY-MM`  
- Built by `getPeriodBillForTenant` in `apps/web/src/lib/billing/period-bill.ts`  
- Not a separate Invoice table  

### Payment settlement
- Gateway: `settleGatewayPayment` (`lib/payments/settle-payment.ts`) after STK webhook  
- Manual: org `verifyTenantPaymentAction` → allocation  
- Combined allocation: `allocateCombinedPeriodPayment` in `lib/ledger.ts`  

### Water
- Caretaker submit → `MeterReading` SUBMITTED + `WaterBill` PENDING_APPROVAL  
- Org approve → ISSUED (payable) → appears on period bill  

### Notifications
- `notifyRecipients` creates one row per recipient **per channel**  
- Communication feed collapses fan-out for display  

### SEO public surface
- Robots + sitemap index + vacancy/landing sitemaps  
- Platform-only guide articles use `privatePlatform: true` and are excluded from public `/guides`  

---

## Personas, routes & shells

| Persona | Entry |
| --- | --- |
| Public / SEO | `/`, `/vacancies`, `/guides`, marketing landings |
| Login | `/login` (also org/landlord variants where configured) |
| Org staff | `/dashboard/org` |
| Tenant | `/dashboard/tenant` |
| Caretaker | `/dashboard/caretaker` |
| Landlord | `/dashboard/landlord` |
| Platform admin | `/platform` (Admin mode) |
| Platform engineering | `/platform/developer` (Developer mode) |
| Lease sign (token) | `/sign-lease/[token]` |
| Document verify | `/verify-document/[code]`, `/verify-lease/[hash]` |

Each persona has a dedicated layout shell (sidebar + mobile nav). Shared dashboard primitives: PageShell / SurfaceCard / StatCard patterns under platform and dashboard components.

---

## Payments & billing (product rules)

### Combined period bill
- Invoice merges **rent + water** for the same `YYYY-MM`.  
- Tenant can pay **full** or **partial** balance.  
- Settlement order: **rent (and other lease charges) → water**.  
- Overpay becomes unapplied amount.  

### Pay Now flow

```text
Tenant invoice (PERIOD_BILL)
        │
        ▼
  /dashboard/tenant/payments/new
  (method chooser — eCitizen style)
        │
        ├─► mpesa-stk (gateway)
        │      STK push → phone PIN
        │      Webhook ResultCode=0
        │      settleGatewayPayment → VERIFIED
        │      allocate balances + receipt + notify
        │
        └─► manual-mpesa / manual-bank
               Paste code / reference
               verificationStatus = PENDING
               Org verifies → allocate + receipt
```

### Key files

| File | Role |
| --- | --- |
| `lib/billing/period-bill.ts` | Build period bill lines/balances |
| `lib/ledger.ts` | Rent + combined allocation |
| `lib/payments/settle-payment.ts` | Gateway auto-settle |
| `lib/payments/methods-catalog.ts` | Method definitions + settlement mode |
| `tenant/payments/checkout/_lib/start-payment.ts` | Start tenant payment |
| `org/payments/_lib/verify-payment-actions.ts` | Org verification |
| `api/webhooks/mpesa/route.ts` | STK callback |
| `lib/mpesa/client.ts` | Daraja STK client |

Deep operator write-up: **Platform → Developer → System Docs → Payments**.

---

## Water metering pipeline

```text
Caretaker (allowed unit)
   → submit reading (+ optional photo)
   → MeterReading SUBMITTED
   → WaterBill PENDING_APPROVAL (not payable yet)

Org water approvals / notifications hub
   → Approve → MeterReading APPROVED, WaterBill ISSUED
              (amountPaid=0, balance=total; tenant notified)
   → Reject  → MeterReading REJECTED; bill not payable

Tenant period bill
   → water line appears when ISSUED (and other payable statuses)
```

Caretakers only see units from `getCaretakerAllowedUnitIds`.

---

## Notifications

- Entry: `notifyRecipients` (notifications package / `lib/notifications/notify`)  
- One product event → many `Notification` rows (IN_APP, SMS, WHATSAPP, EMAIL, WEB_PUSH)  
- IN_APP marked SENT immediately; others QUEUED for dispatch  
- Org communication feed **dedupes channel fan-out** into one logical event  
- Unread alerts: bottom-right toast panel (tenant/org)  

---

## SEO & indexing

EstateDesk is **index-ready** for public content:

| Asset | URL |
| --- | --- |
| Robots | `/robots.txt` |
| Sitemap index (**submit this**) | `/sitemap-index.xml` |
| Core pages | `/sitemap.xml` |
| Rental landings | `/sitemap-rental-landings.xml` |
| Vacancies | `/sitemap-vacancies.xml` |
| Vacancy hubs / units / properties | related `sitemap-*.xml` routes |
| LLM discovery | `/llms.txt` |

Dashboards and private routes are **disallowed** and use `noindex`.  
Platform-only help/system articles are **not** in public `/guides` or sitemaps.

**Google cannot be forced from code.** After production deploy:

1. Verify domain in Google Search Console  
2. Submit `https://estatedesk.co.ke/sitemap-index.xml`  
3. Optionally Bing Webmaster Tools  

Full guide: **`docs/SEO_INDEXING.md`** and **`SITEMAPS.md`**.

---

## Platform control plane

| Mode | URL | Purpose |
| --- | --- | --- |
| Administration | `/platform` | Orgs, users, billing, onboarding, marketing, messages |
| Developer | `/platform/developer` | Health, APIs, flags, rate limits, jobs, backups, system docs |
| Website control | `/platform/control` | Kill switches / nuclear (SUPER_ADMIN) |
| Support access | `/platform/support-access` | Timed org takeover (audited) |

### Kill switches (`PlatformControl` singleton)

Can disable portals, webhooks, cron, public signup/API, and set maintenance/incident banners. Super-admin nuclear tools require typed confirmation phrases.

### Access matrix (summary)

| Capability | PLATFORM_ADMIN | SUPER_ADMIN |
| --- | --- | --- |
| Admin dashboard, orgs, users, billing | Yes | Yes |
| Support Access | Yes | Yes |
| Developer home, health, API explorer, flags, System Docs | Yes | Yes |
| Website Control (kill switches, nuclear) | No | Yes |
| API keys vault | No | Yes |
| Jobs & queues | No | Yes |
| Data management / backups | No | Yes |

---

## In-app help by role (private)

Each signed-in workspace has **role-scoped help** that is never public, never sitemapped, and cannot open another role’s private articles by URL:

| Role | Help hub | Content focus (no secret leak) |
| --- | --- | --- |
| **Platform admin** | `/platform/help` | Admin handbook, support playbook, ops (not eng secrets) |
| **Org staff** | `/dashboard/org/help` | Payments verify, water approve, tenants, roles, month-end |
| **Tenant** | `/dashboard/tenant/help` | Bills, Pay Now, issues, lease — no staff queues |
| **Caretaker** | `/dashboard/caretaker/help` | Assigned units, meters, field issues — no org money tools |
| **Landlord** | `/dashboard/landlord/help` | Owner-facing rent / remote landlord guides |

Source: `apps/web/src/lib/guides/workspace-private.ts` + topic map in `lib/help/in-app-guides.ts`.  
Guides with `privateInApp` / `privatePlatform` are excluded from public `/guides`.

## Platform developer docs (private)

Deep, **non-public** system documentation for platform operators and engineering:

| | |
| --- | --- |
| **URL** | `/platform/developer/docs` |
| **Access** | `SUPER_ADMIN` or `PLATFORM_ADMIN` only |
| **Nav** | Developer mode → **System Docs** |
| **Source of truth** | `apps/web/src/lib/platform/system-docs.ts` |
| **Content** | Architecture, multi-tenancy, data model, payments, water, notifications, APIs/webhooks, SEO, accounting, leases, incidents, tooling map, and more |

Also: shorter platform help at `/platform/help` (still private workspace).  
Repo markdown for contributors: `docs/PROJECT_DOCUMENTATION.md`.

---

## Security model

1. **Sessions** — `UserSession` rows; `activeOrgId` binds org context  
2. **Memberships** — User ↔ Organization with role; queries filter `orgId`  
3. **Guards** — `requireUserSession`, `requirePlatformRole`, tenant access, org permissions (`lib/permissions/*`)  
4. **Platform control** — maintenance and surface kill switches  
5. **Support access** — signed timed cookie; audit-logged enter/extend/leave  
6. **Audit** — sensitive actions and denied access  
7. **Rate limits** — proxy/middleware + tenant-admin buckets  
8. **Secrets** — Daraja, CRON, AUTH_SECRET, S3, API keys never client-exposed  

---

## Testing & QA

```bash
# Unit tests (repo root)
npm run test

# Focused SEO / guides suite
node --import tsx --test \
  tests/unit/seo.test.ts \
  tests/unit/sitemap-utils.test.ts \
  tests/unit/public-rental-seo.test.ts \
  tests/unit/guides.test.ts

# Integration (needs DB)
npm run test:integration

# Tenant portal QA script (workspace)
npm run qa:tenant-portal
```

Latest smoke/QA write-up: **`docs/QA_REPORT.md`**.  
Launch matrix: **`docs/PRE_LAUNCH_STATUS.md`**.

### Local public smoke

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:3000/
curl -sS http://localhost:3000/robots.txt | head
curl -sS http://localhost:3000/sitemap-index.xml
curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/health
```

---

## Deployment

1. Install from **repo root** (npm workspaces).  
2. Vercel/similar: **Root Directory = `apps/web`**.  
3. Run migrations in release pipeline: `npx prisma migrate deploy`.  
4. Set production `NEXT_PUBLIC_APP_URL=https://estatedesk.co.ke` (or your domain).  
5. Apex preferred; www redirect configured in Next config.  
6. Ensure `MPESA_CALLBACK_URL` is public HTTPS if STK is live.  
7. Configure `CRON_SECRET` for scheduled routes.  

See `docs/architecture/DEPLOY.md` and `docs/production-deploy-checklist.md`.

---

## Scripts reference

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server (`@estatedesk/web`) |
| `npm run build` / `start` | Production build & start |
| `npm run lint` / `typecheck` | Quality gates |
| `npm run test` | Unit tests |
| `npm run test:integration` | Integration tests |
| `npm run seed` | Prisma seed |
| `npm run backup:database` | DB backup script |
| `npm run backup:validate` | Validate backup artifact |
| `npm run restore:drill` | Restore drill |
| `npm run load:test` | Load test helper |
| `npm run generate:web-push-keys` | VAPID key generation |
| `npm run extension:package` | Zip browser extension |

---

## Documentation map

| Document | Audience |
| --- | --- |
| **`README.md`** (this file) | Developers & operators — setup + system map |
| **`docs/PROJECT_DOCUMENTATION.md`** | Full technical project doc |
| **`docs/PRODUCT_DOCUMENTATION.md`** | Product vision & personas |
| **`docs/SEO_INDEXING.md`** | SEO + Search Console |
| **`docs/QA_REPORT.md`** | Latest QA results |
| **`docs/ENVIRONMENT.md`** | Env vars |
| **`docs/API.md`** | API notes |
| **`docs/OPERATIONS.md`** | Ops runbook |
| **`docs/PRE_LAUNCH_STATUS.md`** | Launch matrix |
| **`docs/architecture/SERVICES.md`** | Services migration phases |
| **`docs/architecture/DEPLOY.md`** | Deploy notes |
| **`SITEMAPS.md`** | Sitemap operator guide |
| **In-app** `/platform/developer/docs` | **Private deep system docs** |

---

## Contributing

1. Branch from `main`.  
2. Prefer feature modules under `apps/web/src/features` and shared libs under `apps/web/src/lib`.  
3. Keep every query **org-scoped**.  
4. Add/adjust tests when changing SEO, payments, or module structure.  
5. Do not add private platform content to public guide sitemaps (`privatePlatform: true`).  
6. When changing system behavior (payments settlement, architecture phase, auth), update:  
   - `README.md`  
   - `docs/PROJECT_DOCUMENTATION.md`  
   - `apps/web/src/lib/platform/system-docs.ts` (private developer docs)  
7. Do not force-push `main` or rewrite published history without team agreement.  

More: `docs/CONTRIBUTING.md` and `docs/PROJECT_DOCUMENTATION.md`.

---

## License & product context

EstateDesk is a commercial multi-tenant SaaS product oriented to Kenyan rental operations (M-Pesa, water meters, caretaker field work) with multi-market SEO surfaces.

For product positioning and personas, see **`docs/PRODUCT_DOCUMENTATION.md`**.

For the deepest in-product engineering reference (auth flows, payment state machines, Prisma resilience, service extraction map), open:

**`/platform/developer/docs`** while signed in as a platform admin.

---

*README last updated: 2026-07-10.*
