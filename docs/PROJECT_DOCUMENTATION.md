# EstateDesk Project Documentation

## Table of Contents

- [Purpose](#purpose)
- [Platform Scope](#platform-scope)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Core Domain Modules](#core-domain-modules)
- [Data Model Summary](#data-model-summary)
- [Multi-Tenancy and Authorization](#multi-tenancy-and-authorization)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Developer Setup](#developer-setup)
- [Prisma and Database](#prisma-and-database)
- [Deployment Notes](#deployment-notes)
- [Key Files and Paths](#key-files-and-paths)
- [Caretaker Field Operations Portal](#caretaker-field-operations-portal)
- [SEO, Sitemaps, and Crawlers](#seo-sitemaps-and-crawlers)
- [Maintenance and Conventions](#maintenance-and-conventions)

## Purpose

EstateDesk is a multi-tenant property operations SaaS platform built to help Kenyan landlords, property managers, accountants, caretakers, office staff, and tenants manage portfolio workflows in one connected workspace.

This documentation explains the application architecture, data model, developer workflows, and operational assumptions that guide the codebase.

## Platform Scope

EstateDesk enables:

- organization and portfolio management
- property, building, and unit structure
- tenant profiles, leases, and occupancy
- rent, water, and utility billing
- payment tracking, receipts, and verification
- issues, inspections, and field operations
- notices, move-outs, and service accountability
- role-based dashboards and permissioned access
- platform administration and referral tracking

The platform is designed for production use in Kenya, with mobile money friendliness, caretaker workflows, and utility billing awareness.

## Tech Stack

- Next.js `16.x` with the App Router
- React `19.x`
- TypeScript `5.x`
- Prisma `7.x` and PostgreSQL
- Tailwind CSS `4.x`
- `react-hook-form`, `zod`, and `framer-motion`
- Radix UI / shadcn UI patterns
- AWS S3-compatible storage via `@aws-sdk/client-s3`
- Rate limiting and security middleware through `proxy.ts`

## Architecture Overview

EstateDesk is built as a server-rendered React application with server actions and API route handlers.

The main flow is:

1. User interacts with UI in `src/app`
2. UI calls server actions or route handlers
3. Authorization and tenancy are enforced in `src/lib/auth`
4. Business logic runs in `src/features` and `src/lib`
5. Prisma handles database access and migrations

The system is organized into feature modules rather than a monolithic service package.

## Core Domain Modules

Key business domains in the codebase include:

- `organizations`
- `properties`, `buildings`, `units`
- `tenants`, `leases`, `tenant transfers`
- `rentCharges`, `payments`, `payment allocations`
- `water`, `meter readings`, `water bills`
- `issues`, `inspections`, `notices`
- `caretaker assignments`, `landlord profiles`
- `subscriptions`, `apiKeys`, `platformMessages`
- `auditLogs`, `userSessions`, `platformPermissions`

Each domain typically contains:

- UI pages and components under `src/app` or `src/features`
- action handlers in `src/features/*/actions`
- Prisma operations via `src/lib/prisma`
- shared helpers and validation in `src/lib`

## Data Model Summary

The Prisma schema defines a hardened production-ready data model. The most important tables are:

- `User`: platform users with authentication, platform roles, and verification state.
- `Organization`: tenant companies that own properties and workflows.
- `Membership`: links users to organizations and active membership context.
- `Property`, `Building`, `Unit`: portfolio structure.
- `Tenant`, `Lease`: occupancy, contract, payment, and tenant lifecycle.
- `RentCharge`, `Payment`, `PaymentAllocation`: billing and receipt tracking.
- `MeterReading`, `WaterBill`: utility billing and usage workflows.
- `IssueTicket`, `Inspection`: service and maintenance operations.
- `Notification`: in-app and external notification records.
- `ApiKey`, `Subscription`: platform access and subscription management.
- `AuditLog`: sensitive action auditing.

The model is designed for strong indexing, organizational isolation, and query performance.

## Multi-Tenancy and Authorization

EstateDesk enforces strict tenancy and RBAC patterns:

- every business record belongs to an `Organization`
- users must be members of the target organization to access data
- active organization context is resolved from `UserSession`
- no client-provided org identifier is trusted without server validation
- authorization is enforced at the server boundary
- platform roles and permissions are separated from organization roles

This means every query and mutation should be scoped by organization and user membership where relevant.

## Project Structure

The repository follows a feature-oriented layout:

- `src/app` - Next.js App Router pages, layouts, route handlers, static marketing pages, and API entrypoints
- `src/components` - shared reusable UI components and presentation primitives
- `src/features` - domain feature modules with actions, API logic, and feature-specific UI
- `src/hooks` - custom React hooks
- `src/lib` - shared libraries such as Prisma client, authentication, validation, and utility helpers
- `public` - static assets and images
- `prisma` - Prisma schema, migrations, and seed script
- `scripts` - helper scripts like route scaffolding
- `proxy.ts` - custom middleware for request filtering, security headers, and rate limiting
- `backup-routes` - archived route implementations and route-level backups

### Recommended pattern

- Keep domain logic inside `src/features` with small UI components in `src/components`
- Keep auth and org validation in `src/lib/auth`
- Use server actions for form handling and route handlers for REST-style API endpoints
- Keep `src/app` focused on page routing and layout composition

## Environment Variables

See `docs/ENVIRONMENT.md` for the full grouped reference. Runtime validation lives in `src/lib/config/env.ts`.

Important variables are defined in `.env.example` and include:

- `DATABASE_URL`, `DIRECT_URL` - PostgreSQL connection
- `NEXT_PUBLIC_APP_URL`, `APP_URL` - public app URL and server base URL
- `AUTH_SECRET`, `CRON_SECRET` - secrets for auth and scheduled tasks
- `PLATFORM_API_KEYS_PAGE_PASSWORD` - admin protection for API keys page
- `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_PUBLIC_BASE_URL`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` - storage settings
- `WHATSAPP_*` - optional WhatsApp messaging integration settings

Use `.env` for local development and never check secrets into source control.

## Developer Setup

### Prerequisites

- Node.js `20.x` or later
- npm `10.x` or later
- PostgreSQL database
- `git`

### Local Installation

```bash
cd /home/baba-nyakio/Desktop/estatedesk-main
npm install
cp .env.example .env
# edit .env with your database and secret values
```

### Database Setup

```bash
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```

### Run Locally

```bash
npm run dev
```

The app runs at `http://localhost:3000` by default.

### Build for Production

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint
```

## Prisma and Database

`prisma.config.ts` resolves the datasource from `DIRECT_URL`, `DATABASE_URL`, or a fallback local connection.

The schema is located at `prisma/schema.prisma` and migrations are stored under `prisma/migrations`.

The seed command is configured as `tsx prisma/seed.ts`.

## Deployment Notes

- Make sure `PRIMARY_URL` or `APP_URL` matches the deployed domain
- Ensure PostgreSQL credentials are secure and connection strings are set in environment variables
- Run `npx prisma migrate deploy` in production before starting the app
- Generate Prisma client during build or install via `npm run build`
- Configure S3-compatible storage values for file upload support
- If using WhatsApp integration, configure `WHATSAPP_PROVIDER`, account IDs, access tokens, and templates

## Key Files and Paths

- `README.md` - project overview and getting started
- `docs/PROJECT_DOCUMENTATION.md` - developer and architecture documentation
- `.env.example` - environment variable template
- `prisma/schema.prisma` - database schema and model definitions
- `prisma.config.ts` - Prisma configuration and datasource logic
- `proxy.ts` - security middleware, rate limiting, and request filtering
- `src/lib/prisma.ts` - Prisma client export
- `src/lib/auth` - auth/session/org validation helpers
- `src/app` - Next.js App Router pages, API routes, and route handlers
- `src/features` - core business feature implementations
- `src/components` - UI primitives and shared components

## Caretaker Field Operations Portal

Caretaker workflows live under `src/app/(app)/dashboard/caretaker` and follow the same modular pattern as org and tenant dashboards: thin `page.tsx` files, `_lib/queries.ts`, and `_components/*-workspace.tsx` shells.

### Route map

| Area | Path | Purpose |
| --- | --- | --- |
| Today's work | `/dashboard/caretaker/today` | Prioritized inspections, meter readings, and issues with SLA badges |
| Issues | `/dashboard/caretaker/issues` | Scoped issue board, detail lifecycle, completion reports |
| New issue | `/dashboard/caretaker/issues/new` | Field reporting with optional photo evidence |
| Water bills | `/dashboard/caretaker/water-bills` | Period readings, bill visibility, meter entry |
| Inspections | `/dashboard/caretaker/inspections` | Move-out checklists, GPS check-in, printable reports |
| Units | `/dashboard/caretaker/units` | Assigned unit list and 360° unit profiles with QR codes |
| Tenants | `/dashboard/caretaker/tenants` | Tenant contact with call/SMS/WhatsApp actions |
| Handover | `/dashboard/caretaker/handover` | Bilingual shift notes with open-issue prefill |
| Vendors | `/dashboard/caretaker/vendors` | Approved suppliers and dispatch requests |
| Search / calendar / documents / broadcasts / move-outs | respective routes | Scoped lookup and coordination |

Authenticated print routes (noindex, disallowed in `robots.ts`):

- `/print/inspections/[inspectionId]` — inspection report PDF/print view
- `/print/issues/[issueId]` — caretaker issue work order

### Shared caretaker infrastructure

| Module | Path | Role |
| --- | --- | --- |
| Access scope | `src/lib/caretaker/access.ts` | Property/building/unit assignment guards |
| Paths | `src/app/(app)/dashboard/caretaker/_lib/paths.ts` | Server-only public ID href helpers |
| Client paths | `src/app/(app)/dashboard/caretaker/_lib/paths.client.ts` | Client-safe href helpers (no `node:crypto`) |
| Offline queue | `src/app/(app)/dashboard/caretaker/_lib/offline-queue.ts` | LocalStorage queue for meter readings and issues |
| Offline photos | `src/app/(app)/dashboard/caretaker/_lib/offline-photo-store.ts` | IndexedDB photo blobs for offline sync |
| SLA helpers | `src/lib/issues/sla.ts` | Shared SLA state used by caretaker and org issue views |
| Contact links | `src/app/(app)/dashboard/caretaker/_lib/contact.ts` | `tel:`, `sms:`, `mailto:`, and `wa.me` helpers |
| i18n | `src/app/(app)/dashboard/caretaker/_lib/i18n.ts` | English/Swahili labels for nav, Today, and issues |

### Offline sync flow

1. Client forms detect `!navigator.onLine` and enqueue meter/issue payloads locally.
2. Optional photos are stored in IndexedDB and attached as base64 payloads during sync.
3. `syncOfflineQueueAction` validates caretaker unit scope, writes Prisma records, and uploads photo assets.
4. The header offline panel exposes queue count, sync, and clear actions.

### Tests

Caretaker-specific unit tests:

- `tests/unit/caretaker-sla.test.ts`
- `tests/unit/caretaker-contact.test.ts`
- `tests/unit/handover-prefill.test.ts`

Modular route layout is enforced by `tests/unit/module-structure.test.ts`, including `print/issues/[issueId]`.

## SEO, Sitemaps, and Crawlers

Public discovery is centralized in:

- `src/lib/seo.ts` — site metadata, keywords, canonical URLs, and robots helpers
- `src/lib/public-site-index.ts` — manifest of indexable marketing pages
- `src/app/sitemap-index.xml/route.ts` — submitted sitemap index
- `src/app/robots.ts` — crawl rules; blocks dashboards, API, print, and invite routes
- `src/app/llms.txt/route.ts` — LLM/crawler discovery index for public pages and product themes

See `SITEMAPS.md` for validation commands and Search Console submission steps.

**Indexing policy**

- Index: marketing, pricing, guides, vacancies, and auth entry pages.
- Noindex + disallow: all `/dashboard/*`, `/platform/*`, `/api/*`, `/print/*`, staff/tenant workspace shortcuts, and utility/system pages.
- LLM crawlers (`GPTBot`, `Google-Extended`, `CCBot`) receive the same private-route disallow list as generic crawlers.

## Maintenance and Conventions

- Keep all organization-scoped queries wrapped in membership validation
- Keep UI logic separate from server-side mutations and database operations
- Favor server actions for form and submit handling where possible
- Preserve backup routes in `backup-routes` for in-progress refactors
- Use `SITEMAPS.md` for sitemap and SEO-related page guidance
- Never import server-only path helpers (`_lib/paths.ts`, `@/lib/public-id`) from `"use client"` caretaker components; use `paths.client.ts` instead
- Add caretaker modular route entries to `tests/unit/module-structure.test.ts` when introducing new pages
- Keep `components.json` aligned with Tailwind and shadcn conventions

---

For new contributors and maintainers, this document is the primary reference for understanding how EstateDesk is structured and how to work with it effectively.