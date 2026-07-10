# EstateDesk service architecture

Living map of the modular monorepo → microservices migration.

## Layout

```
apps/web              Next.js UI + BFF (current deployable)
apps/workers          (Phase 2) cron / queue consumers
packages/*            shared libraries (config, contracts, auth-sdk, …)
services/*            domain services (in-process first, then network)
prisma/               shared schema during transition (legacy)
```

## Service map

| Service | Package | Owns (models / concerns) | Phase 1 status |
| --- | --- | --- | --- |
| **auth** | `@estatedesk/auth` | User, UserSession, password reset, email verify | stub |
| **orgs** | `@estatedesk/orgs` | Organization, Membership, Subscription, Invitation, staff | stub |
| **portfolio** | `@estatedesk/portfolio` | Property, Building, Unit, PropertyUnitPlan, assets | stub |
| **occupancy** | `@estatedesk/occupancy` | Tenant*, Lease*, move-outs, inspections, caretaker assignments | stub |
| **payments** | `@estatedesk/payments` | Payment*, RentCharge, Receipt, M-Pesa webhook | stub |
| **water** | `@estatedesk/water` | MeterReading, WaterBill | stub |
| **issues** | `@estatedesk/issues` | IssueTicket, resolution reports | stub |
| **accounting** | `@estatedesk/accounting` | Accounting* graph, Expenditure | stub |
| **tax** | `@estatedesk/tax` | TaxpayerProfile, Kra*, TaxCharge | stub |
| **notifications** | `@estatedesk/notifications` | Notification, PushSubscription, delivery | **in-process library** |
| **documents** | `@estatedesk/documents` | DocumentRecord, S3, trust registry | stub |
| **platform** | `@estatedesk/platform` | onboarding, platform control, exports | stub |
| **public-vacancy** | `@estatedesk/public-vacancy` | public listings, SEO/sitemaps | **in-process library** |

## Shared packages

| Package | Role |
| --- | --- |
| `@estatedesk/config` | Env schema / runtime env report |
| `@estatedesk/contracts` | Zod DTOs + domain event types |
| `@estatedesk/db-kit` | DB retry helpers (Prisma client still in web) |
| `@estatedesk/auth-sdk` | Session claim types for multi-service auth |
| `@estatedesk/service-client` | Typed HTTP client stub |
| `@estatedesk/events` | Outbox publisher interface + in-process bus |

## Ownership rules

1. **After a service is extracted**, only that service may write its owned tables.
2. Cross-service reads use APIs or event-fed local projections — not shared Prisma joins.
3. **No distributed 2PC.** Side effects (payment → accounting) use outbox events.
4. UI composition stays in `apps/web` (BFF). Domain services stay thin and domain-focused.

## Easy seams (extract next)

1. `public-vacancy` (already a library package)
2. Cron workers (`/api/cron/*` → `apps/workers`)
3. M-Pesa webhook → `payments`
4. Documents / S3
5. Notifications delivery workers

## Hard seams

1. Payment → ledger → accounting
2. Session + org permission guards
3. Cross-domain dashboards / insights

## Deploy notes (Vercel)

- Set project **Root Directory** to `apps/web`.
- Install from repository root: `npm install` (workspaces).
- Prisma schema remains at repo root (`prisma/`).
- Keep environment variables on the Vercel project.

## Phases

| Phase | Outcome |
| --- | --- |
| 1 (current) | Monorepo + `apps/web` + packages + service stubs; public-vacancy & notifications as libraries |
| 2 | First process boundaries (workers, public-vacancy HTTP, documents) |
| 3 | Auth + orgs services |
| 4 | Payments hub + accounting via events |
| 5 | Remaining domains + DB-per-service cutovers |
| 6 | Multi-service ops, retire shared Prisma |
