/**
 * Private platform-operator system documentation.
 * Served only under /platform/developer/docs (SUPER_ADMIN / PLATFORM_ADMIN).
 * Never published to public /guides or sitemaps.
 *
 * Keep this file as the in-product source of truth for "how the whole system works".
 * Mirror high-level facts in README.md and docs/PROJECT_DOCUMENTATION.md.
 */

export type SystemDocSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  code?: string;
};

export type SystemDocArticle = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  order: number;
  readingMinutes: number;
  sections: SystemDocSection[];
};

export const systemDocArticles: SystemDocArticle[] = [
  {
    slug: "system-overview",
    title: "System overview — how EstateDesk fits together",
    summary:
      "End-to-end map of users, organizations, apps, packages, database, and the full request lifecycle from browser to side effects.",
    category: "Foundation",
    order: 1,
    readingMinutes: 18,
    sections: [
      {
        heading: "What EstateDesk is",
        paragraphs: [
          "EstateDesk is a multi-tenant property operations SaaS. A single Next.js application (apps/web) serves marketing pages, authentication, organization workspaces, tenant/caretaker/landlord portals, platform administration, public APIs, webhooks, cron jobs, and SEO assets.",
          "Business data is isolated by organization (orgId on nearly every operational table). Platform operators manage all orgs from /platform. End users never cross org boundaries without a verified membership or a timed, audited support session.",
          "Product positioning is Kenya-first (M-Pesa Daraja STK, manual M-Pesa codes, water meters, caretaker field ops) while the multi-tenant model and SEO surfaces also support multi-market landings.",
        ],
      },
      {
        heading: "Runtime topology (Phase 1 — modular monolith)",
        paragraphs: [
          "Despite a services/ folder, runtime is a modular monorepo monolith: one deployable (apps/web), one PostgreSQL database (Prisma schema at repo root), and shared packages imported in-process. There is no network hop between 'services' today.",
        ],
        bullets: [
          "apps/web — Next.js App Router UI + BFF + domain logic (ONLY primary deployable)",
          "packages/* — config, contracts, auth-sdk, db-kit, events, service-client",
          "services/* — domain packages (mostly stubs); notifications and public-vacancy are real in-process libraries",
          "prisma/ — single schema + migrations for all domains",
        ],
        code: `Browser / PWA
    │
    ▼
apps/web  (pages, Server Actions, API routes, webhooks, cron)
    │
    ├─► packages/*   (shared libs)
    ├─► services/*   (in-process libraries or stubs)
    └─► PrismaPg ──► Neon / PostgreSQL (one DB)`,
      },
      {
        heading: "Request lifecycle (detailed)",
        paragraphs: [
          "1) Browser hits a route under apps/web/src/app (App Router). Marketing routes live in (marketing); authenticated product routes in (app); auth in (auth).",
          "2) middleware.ts / proxy.ts enforce security headers, rate-limit buckets, and selected edge policies before the page/handler runs.",
          "3) Layouts call requireUserSession / requireOrgMembership / requirePlatformRole / requireTenantAccess. Guards read UserSession, membership, PlatformControl kill switches, and may redirect to /login, /access-denied, or /maintenance.",
          "4) Pages and Server Actions use Prisma through apps/web/src/lib/prisma.ts (Prisma 7 + PrismaPg adapter). Pool defaults are conservative (max 5) for Neon free/pooler. Transient failures can be retried via packages/db-kit and lib/db/retry.",
          "5) Side effects run in the same process: notifyRecipients, accounting postVerifiedPayment, issueDocumentRecord / receipt snapshots, audit logs.",
          "6) External entry: M-Pesa STK callbacks hit /api/webhooks/mpesa and call settleGatewayPayment; cron hits /api/cron/* with CRON_SECRET; public vacancy API uses org API keys.",
        ],
      },
      {
        heading: "Personas and shells",
        paragraphs: [
          "Each persona has a dedicated dashboard shell and nav. Platform shell has dual mode (Administration vs Developer) with localStorage + cookie memory and keyboard shortcuts Alt+Shift+A / Alt+Shift+D.",
        ],
        bullets: [
          "Org (ADMIN/MANAGER/OFFICE/ACCOUNTANT) → /dashboard/org",
          "Tenant → /dashboard/tenant",
          "Caretaker → /dashboard/caretaker (unit-scoped allow-list)",
          "Landlord → /dashboard/landlord",
          "Platform SUPER_ADMIN / PLATFORM_ADMIN → /platform (Admin + Developer modes)",
          "Public → /, /vacancies, marketing landings, /guides (public only)",
        ],
      },
      {
        heading: "Mental model for debugging",
        paragraphs: [
          "Ask four questions: (1) Which persona and shell? (2) Which orgId / membership role? (3) Which domain tables mutate? (4) Which side effects should fire (notify, accounting, receipt, webhook)? Most production bugs are either auth/scoping mistakes, payment state-machine misunderstandings, or Neon pool/timeouts under concurrent Promise.all.",
        ],
      },
    ],
  },
  {
    slug: "architecture-monorepo",
    title: "Architecture — monorepo, packages, and services",
    summary:
      "How workspaces, imports, stubs vs libraries, deploy shape, and the path toward microservices actually work in this repo.",
    category: "Foundation",
    order: 2,
    readingMinutes: 16,
    sections: [
      {
        heading: "npm workspaces",
        paragraphs: [
          "Root package.json defines workspaces apps/*, packages/*, services/*. npm install at root hoists dependencies. Dev/build scripts run the web workspace: npm run dev / build / start map to -w @estatedesk/web.",
          "postinstall runs prisma generate so the client exists after install. Application TypeScript path aliases (@/) resolve inside apps/web.",
        ],
      },
      {
        heading: "Shared packages (what each does)",
        paragraphs: [
          "These packages are imported in-process; they are not separate deployables.",
        ],
        bullets: [
          "@estatedesk/config — env keys, SSL URL normalization for Neon (uselibpqcompat)",
          "@estatedesk/contracts — Zod DTOs and event names (M-Pesa, public vacancy, health)",
          "@estatedesk/db-kit — transient DB retry helpers used by layout and billing paths",
          "@estatedesk/auth-sdk — session claim types for future multi-service auth",
          "@estatedesk/events — in-process bus interface (outbox-ready)",
          "@estatedesk/service-client — HTTP client stub for future remote services",
        ],
      },
      {
        heading: "services/* reality check",
        paragraphs: [
          "Most service packages export a stub SERVICE = { status: 'stub' }. Implementation still lives in apps/web/src/lib and apps/web/src/features. Exceptions: @estatedesk/notifications (notifyRecipients, dispatch, email/push helpers) and @estatedesk/public-vacancy (listings, slug resolve, sitemaps helpers) are imported as real libraries.",
          "See docs/architecture/SERVICES.md for extraction phases. Do not split databases or deploy separate processes until isolation has a clear operational need and event boundaries are solid.",
        ],
        code: `Phase 1 (current): monorepo + apps/web + packages + service stubs
Phase 2: first process boundaries (workers, public-vacancy HTTP, documents)
Phase 3: auth + orgs services
Phase 4: payments hub + accounting via events
Phase 5: remaining domains + DB-per-service cutovers
Phase 6: multi-service ops, retire shared Prisma`,
      },
      {
        heading: "Easy vs hard extraction seams",
        paragraphs: [
          "Easy next seams: public-vacancy (already a library), cron workers (/api/cron/* → apps/workers), M-Pesa webhook → payments service, documents/S3, notifications delivery workers.",
          "Hard seams: payment → ledger → accounting (needs outbox, not 2PC), session + org permission guards, cross-domain dashboards/insights that currently join across tables in one query.",
        ],
      },
      {
        heading: "Where to put new code",
        paragraphs: [
          "UI routes: apps/web/src/app/(app)/dashboard/{role}/…",
          "Mutations: apps/web/src/features/*/actions or colocated actions.ts next to the page",
          "Cross-cutting domain: apps/web/src/lib/{domain}",
          "Shared pure helpers that other packages need: packages/*",
          "Never write cross-org queries without membership checks. Prefer soft-fail optional widgets on portals over hard 500s when a secondary query times out.",
        ],
      },
      {
        heading: "Deploy shape",
        paragraphs: [
          "Vercel (or similar): set project Root Directory to apps/web but install from repository root so workspaces resolve. Prisma schema remains at repo root (prisma/). Env vars live on the hosting project. Migrations run as a release step: npx prisma migrate deploy.",
        ],
      },
    ],
  },
  {
    slug: "multi-tenancy-auth",
    title: "Multi-tenancy, sessions, and authorization",
    summary:
      "How sessions bind users to orgs, how RBAC and platform roles work, support access, and kill-switch gates.",
    category: "Security",
    order: 3,
    readingMinutes: 20,
    sections: [
      {
        heading: "Session model",
        paragraphs: [
          "Users authenticate into UserSession rows. Cookie policy and session loading live under apps/web/src/lib/auth/. Active organization context is session.activeOrgId for org users. Platform admins may have null active org while working in /platform.",
          "Session hardening includes dual-session limits, password change gates (mustChangePassword), email verification where required, and terms acceptance enforced in the (app) layout security gate.",
        ],
      },
      {
        heading: "Organization membership",
        paragraphs: [
          "Membership links User ↔ Organization with role: ADMIN, MANAGER, OFFICE, ACCOUNTANT, CARETAKER, LANDLORD, TENANT (and related). Every business table that holds operational data includes orgId and queries must filter by it.",
          "Role permissions are centralized in lib/permissions/role-matrix.ts (OrgPermission checks). Prefer roleHasOrgPermission for fine-grained capabilities over ad-hoc role string compares when adding features.",
        ],
      },
      {
        heading: "Guards (call these, don't invent new ones lightly)",
        paragraphs: [
          "Guards live in apps/web/src/lib/permissions/guards.ts and related access helpers.",
        ],
        bullets: [
          "requireUserSession / requireAuthenticated — any logged-in user",
          "requireOrgMembership — activeOrgId + activeOrgRole present",
          "requirePlatformRole(['SUPER_ADMIN','PLATFORM_ADMIN']) — platform shell",
          "requireTenantAccess — user linked to Tenant in active org; lease rules for some paths",
          "Org role / permission guards — membership.role or role-matrix permission",
          "Caretaker unit allow-lists — getCaretakerAllowedUnitIds scopes meters/issues",
        ],
      },
      {
        heading: "PlatformControl gates inside guards",
        paragraphs: [
          "requireOrgMembership (and related portal paths) consult PlatformControl. If maintenanceMode is on, non-platform users go to /maintenance. orgDashboardsDisabled and tenantPortalsDisabled redirect field/org portals. Platform operators (SUPER_ADMIN / PLATFORM_ADMIN) retain access during surface kills so they can fix the plane.",
        ],
      },
      {
        heading: "Support access (timed org takeover)",
        paragraphs: [
          "Platform operators open /platform/support-access, pick an org, reason, and duration (1–8h). A signed cookie estatedesk_support_session grants temporary ADMIN membership semantics in that org without sharing staff credentials.",
          "The org shell shows an amber banner with extend/leave. Enter/extend/leave are audit-logged. Prefer this over impersonation hacks. Implementation: lib/platform/support-session.ts.",
        ],
      },
      {
        heading: "Platform control kill switches & nuclear tools",
        paragraphs: [
          "PlatformControl singleton (id=global) can disable portals, webhooks, cron, public signup/API, and set maintenance/incident banners. Super-admin nuclear tools on /platform/control require typed confirmation phrases. Always treat these as production-grade blast radius — confirm with ops before toggling in prod.",
        ],
      },
      {
        heading: "Denied access auditing",
        paragraphs: [
          "When a platform role guard fails, auditDeniedAccess records reason, required roles, and entity context. Investigate unexpected denials via /platform/audit-logs and /platform/security.",
        ],
      },
    ],
  },
  {
    slug: "data-model-core",
    title: "Data model — core entities and relationships",
    summary:
      "Prisma entities that matter for debugging production incidents, with relationship notes and product constructs that are not tables.",
    category: "Data",
    order: 4,
    readingMinutes: 22,
    sections: [
      {
        heading: "Schema location",
        paragraphs: [
          "Single source of truth: prisma/schema.prisma at repo root. Migrations in prisma/migrations/. Client generated into node_modules/.prisma and used via apps/web/src/lib/prisma.ts.",
          "There is no separate DB per service in Phase 1. Soft deletes use deletedAt where present (e.g. leases).",
        ],
      },
      {
        heading: "Identity & tenancy",
        bullets: [
          "User — credentials, platformRole (null | PLATFORM_ADMIN | SUPER_ADMIN), mustChangePassword, terms",
          "UserSession — active sessions, activeOrgId, device/session metadata",
          "Organization — currency, timezone, status, slug, commercial fields",
          "Membership — org role bridge (User ↔ Organization)",
          "Subscription — plan/status for billing gates on org features",
          "OrganizationSettings — org-level preferences and pay targets",
        ],
        paragraphs: [],
      },
      {
        heading: "Portfolio & occupancy",
        bullets: [
          "Property → Building → Unit (houseNo, status, vacancy publish fields)",
          "Tenant (slug unique per org) ↔ optional User for portal login",
          "Lease binds Tenant + Unit; monthlyRent, dueDay, status ACTIVE/…, deletedAt",
          "LeaseSignatureEnvelope / Signer / Event — multi-party e-sign flow + audit trail",
        ],
        paragraphs: [
          "Active occupancy for billing almost always means: ACTIVE lease, non-deleted, correct orgId, tenant linked to the session user for portal paths.",
        ],
      },
      {
        heading: "Billing balances (money tables)",
        bullets: [
          "RentCharge — period YYYY-MM, amountDue, amountPaid, balance, status UNPAID|PARTIAL|PAID|OVERDUE|WAIVED",
          "WaterBill — total, amountPaid, balance, status pipeline ISSUED…PAID_VERIFIED (and PENDING_APPROVAL pre-issue)",
          "TaxCharge — statutory obligations when tax features are used",
          "Payment — amount, method, gatewayStatus, verificationStatus, targetType (RENT|WATER|COMBINED|…), transactionReferenceKey uniqueness",
          "PaymentAllocation — rent line splits (water tracked via WaterBill.amountPaid/balance)",
        ],
        paragraphs: [
          "Combined period bills are a product/UX construct over RentCharge + WaterBill for the same YYYY-MM, not a separate Invoice table. getPeriodBillForTenant assembles lines and balances.",
        ],
      },
      {
        heading: "Ops, trust, platform",
        bullets: [
          "MeterReading — SUBMITTED → APPROVED/REJECTED; drives WaterBill creation/status",
          "IssueTicket, Inspection, MoveOutNotice — field and lifecycle ops",
          "Notification — multi-channel fan-out rows (one event → many channels)",
          "DocumentRecord + Receipt — trust registry serials and printable receipts",
          "AuditLog — sensitive actions and denials",
          "PlatformControl / PlatformWebhookEvent / CronJobRun / ApiKey — control plane",
          "Accounting* graph — accounts, journals, periods, requests (org-level)",
        ],
        paragraphs: [],
      },
      {
        heading: "Indexing & uniqueness tips",
        paragraphs: [
          "Payment.transactionReferenceKey uniqueness prevents duplicate M-Pesa code reuse. When debugging 'code already used', search payments by that key and related org.",
          "Tenant slug uniqueness is per org — public-facing tenant IDs are not global UUIDs in UI copy.",
        ],
      },
    ],
  },
  {
    slug: "payments-billing-deep",
    title: "Payments & billing — deep walkthrough",
    summary:
      "Combined rent+water bills, Pay Now method chooser, STK auto-settle vs manual verification, allocation order, receipts, and ops debugging.",
    category: "Money",
    order: 5,
    readingMinutes: 28,
    sections: [
      {
        heading: "Product rules (memorize these)",
        paragraphs: [
          "1) A tenant period bill merges rent + water for one YYYY-MM into a single PERIOD_BILL card (typeLabel Rent + Water).",
          "2) Tenant may pay full balance or a partial amount up to remaining balance.",
          "3) Allocation order: open lease charges for the period (RENT first / other lease charges), then water bill balance. Overpay becomes unappliedAmount.",
          "4) Instant gateways (M-Pesa STK) auto-settle on successful webhook — no org manual review.",
          "5) Manual M-Pesa / bank stay PENDING until an org reviewer verifies.",
        ],
      },
      {
        heading: "Combined period bill construction",
        paragraphs: [
          "getPeriodBillForTenant (lib/billing/period-bill.ts) loads the ACTIVE lease for the tenant, then rent charges and water bills for the period. Water outstanding respects payable statuses; PENDING_APPROVAL water is shown carefully but not treated as tenant-payable balance (balance forced to 0 for pay).",
          "Pay Now links to /dashboard/tenant/payments/new?source=period_bill&id=YYYY-MM&amount=BALANCE (and related query params).",
        ],
      },
      {
        heading: "Method chooser (eCitizen-style)",
        paragraphs: [
          "listAvailablePaymentMethods / methods-catalog surfaces methods based on env + org pay targets:",
        ],
        bullets: [
          "Instant: mpesa-stk — only if Daraja env is configured AND org M-Pesa targets exist",
          "Manual: manual-mpesa, manual-bank when pay targets exist",
          "Plus org-enabled catalog methods (paybill/bank) as manual proof rails",
          "Each method has a settlementMode: gateway vs manual",
        ],
      },
      {
        heading: "Gateway settlement (STK) — step by step",
        paragraphs: [
          "startTenantPayment creates Payment with method MPESA_STK, gatewayStatus INITIATED/PENDING, verificationStatus NOT_REQUIRED (or equivalent not-pending-review), callbackRaw.settlementMode=gateway, targetType COMBINED when paying a period bill.",
          "Daraja STK push (lib/mpesa/client.ts) normalizes phone to 254…, uses Africa/Nairobi timestamp, sandbox or production base URL from MPESA_ENVIRONMENT, and stores CheckoutRequestID on the payment.",
          "Webhook POST /api/webhooks/mpesa (?secret=MPESA_CALLBACK_SECRET when set). On ResultCode=0: update success fields, then settleGatewayPayment.",
          "settleGatewayPayment (lib/payments/settle-payment.ts): if already VERIFIED, return alreadySettled; else mark verified, run allocateCombinedPeriodPayment or allocateRentPayment, issue receipt document/snapshot, postVerifiedPayment accounting (best-effort), notify tenant.",
        ],
        code: `Tenant Pay Now
  → startTenantPayment (Payment created)
  → Daraja STK push
  → User enters PIN on phone
  → /api/webhooks/mpesa ResultCode=0
  → settleGatewayPayment
       → verificationStatus VERIFIED
       → allocate rent then water
       → receipt + document registry
       → accounting post (if configured)
       → notifyRecipients`,
      },
      {
        heading: "Manual settlement",
        paragraphs: [
          "Manual methods create verificationStatus PENDING. Org reviewer uses verifyTenantPaymentAction (org/payments/_lib/verify-payment-actions.ts). Allocation uses allocateCombinedPeriodPayment for COMBINED / period_bill metadata, else rent/water specific allocators.",
          "Reject / fail paths leave balances unchanged and should surface reason to staff. Duplicate transaction references fail on unique transactionReferenceKey.",
        ],
      },
      {
        heading: "Allocation internals",
        paragraphs: [
          "lib/ledger.ts is the money engine. allocateRentPayment walks open RentCharge rows for the lease/period window and writes PaymentAllocation lines, updating amountPaid/balance/status.",
          "allocateCombinedPeriodPayment first allocates to lease charges for the period, then applies remaining amount to the period WaterBill (amountPaid/balance/status toward PAID_VERIFIED when fully covered).",
          "Always pass orgId into ledger helpers — they re-check lease ownership.",
        ],
      },
      {
        heading: "Key files",
        bullets: [
          "lib/billing/period-bill.ts — period bill assembly",
          "lib/ledger.ts — allocateRentPayment, allocateCombinedPeriodPayment",
          "lib/ledger-utils.ts — period math, number coercion",
          "lib/payments/settle-payment.ts — gateway auto-settle",
          "lib/payments/methods-catalog.ts — method definitions + settlement mode",
          "lib/payments/lifecycle.ts / method-flow.ts — state helpers",
          "lib/mpesa/client.ts — Daraja STK",
          "tenant/payments/checkout/_lib/start-payment.ts — start payment",
          "org/payments/_lib/verify-payment-actions.ts — org verify",
          "api/webhooks/mpesa/route.ts — STK callback",
          "lib/kcb/* — KCB IPN matching when paybill credits arrive",
        ],
        paragraphs: [],
      },
      {
        heading: "Ops debugging tips",
        paragraphs: [
          "Duplicate M-Pesa codes → unique transactionReferenceKey conflict; find existing payment.",
          "STK never settles → PlatformControl.webhooksDisabled; MPESA_CALLBACK_URL reachability from Safaricom; callback secret mismatch; CheckoutRequestID not matching any payment; check PlatformWebhookEvent samples.",
          "Balances don't move after verify → Payment.targetType, callbackRaw.source / period, rentChargeId/waterBillId FKs, and whether allocateCombinedPeriodPayment ran inside a transaction.",
          "Manual stuck PENDING → by design until org verifies; not a gateway bug.",
          "Empty Prisma errors on pay pages → often Neon ETIMEDOUT; check pool size and concurrent queries (see Ops runbook).",
        ],
      },
    ],
  },
  {
    slug: "water-metering",
    title: "Water metering & approval pipeline",
    summary:
      "Caretaker submit → org approval → ISSUED water bill → combined billing, with access control and key paths.",
    category: "Ops",
    order: 6,
    readingMinutes: 14,
    sections: [
      {
        heading: "Pipeline",
        paragraphs: [
          "Caretaker captures reading for an assigned unit (photo optional, offline-capable UX on caretaker shell). System upserts MeterReading SUBMITTED and WaterBill PENDING_APPROVAL with amountPaid=0 and balance derived from total (not tenant-payable until issued).",
          "Org water approvals queue (or notifications hub) reviews reading. Approve → reading APPROVED, WaterBill ISSUED with balances, accrual best-effort, tenant notified.",
          "Reject → reading REJECTED with reason; bill not payable.",
        ],
        code: `Caretaker unit allow-list
    → quick-submit-meter-reading
    → MeterReading SUBMITTED
    → WaterBill PENDING_APPROVAL

Org approveMeterReading / water-approval-queue
    → MeterReading APPROVED
    → WaterBill ISSUED (payable)
    → notify tenant
    → appears on PERIOD_BILL for YYYY-MM`,
      },
      {
        heading: "Access control",
        paragraphs: [
          "Caretakers only see units from getCaretakerAllowedUnitIds (lib/caretaker/access.ts). Org roles see org-wide queue. Tenant sees bills for their unit/lease only via tenant portal context helpers.",
        ],
      },
      {
        heading: "Status semantics",
        paragraphs: [
          "isPayableWaterBillStatus (lib/water-bills/status.ts) is the gate used by period-bill assembly and payment allocation. PENDING_APPROVAL and CANCELLED must never accept tenant money as settled water. PAID_VERIFIED means water side is closed for that bill.",
        ],
      },
      {
        heading: "Key paths",
        bullets: [
          "caretaker/water-bills/read/[unitId]/_lib/quick-submit-meter-reading.ts",
          "org/water-bills/_components/water-approval-queue.tsx",
          "org/notifications/actions.ts — approveMeterReading",
          "lib/water-bills/status.ts",
          "lib/billing/period-bill.ts — water line on period bill",
        ],
        paragraphs: [],
      },
    ],
  },
  {
    slug: "notifications-delivery",
    title: "Notifications — fan-out and delivery",
    summary:
      "How one product event becomes many Notification rows, channel delivery, feed dedupe, and unread UI.",
    category: "Ops",
    order: 7,
    readingMinutes: 12,
    sections: [
      {
        heading: "notifyRecipients",
        paragraphs: [
          "services/notifications (and apps/web re-exports under lib/notifications) expose notifyRecipients. It creates one row per recipient per channel (IN_APP, SMS, WHATSAPP, EMAIL, WEB_PUSH by default or per call overrides).",
          "IN_APP is typically marked SENT immediately so the product feed updates. Other channels are QUEUED for dispatch workers / cron (dispatch.ts).",
        ],
      },
      {
        heading: "Communication feed collapse",
        paragraphs: [
          "Because fan-out creates multiple rows for one logical event, the org communication feed collapses multi-channel rows into one display event so staff do not see triple duplicates for SMS+EMAIL+IN_APP.",
        ],
      },
      {
        heading: "Unread alerts UI",
        paragraphs: [
          "UnreadNotificationAlertsPanel polls for unread tenant/org alerts and renders bottom-right toasts that avoid clashing with the top bar. Badge sync integrates with PWA badge helpers where installed.",
        ],
      },
      {
        heading: "Debugging delivery",
        paragraphs: [
          "Check Notification status QUEUED vs FAILED vs SENT. Failed SMS/WhatsApp usually means provider credentials or rate limits. Platform developer home shows queued/failed counts. Web-push needs VAPID keys and active PushSubscription rows.",
        ],
      },
    ],
  },
  {
    slug: "leases-signing-occupancy",
    title: "Leases, e-sign, and occupancy lifecycle",
    summary:
      "How tenants, leases, signature envelopes, move-outs, and portal access interlock.",
    category: "Occupancy",
    order: 8,
    readingMinutes: 14,
    sections: [
      {
        heading: "Lease as the center of occupancy",
        paragraphs: [
          "An ACTIVE Lease binds Tenant + Unit under an org. monthlyRent and dueDay drive rent charge generation and period due dates. Soft-delete (deletedAt) and status transitions must stay consistent with portal access rules (tenantPathRequiresActiveLease for some routes).",
        ],
      },
      {
        heading: "E-sign envelopes",
        paragraphs: [
          "LeaseSignatureEnvelope groups signers (LeaseSignatureSigner) and events (LeaseSignatureEvent). Public signing uses tokenized route /sign-lease/[token]. Verification surfaces include /verify-lease/[hash]. Snapshot/PDF helpers live under lib/documents and lib/leases/signing.ts.",
          "Layout bugs historically surfaced when leaseSignatureSigner relations were assumed present without soft-fail — prefer optional chaining and soft widgets on portal shells.",
        ],
      },
      {
        heading: "Move-outs & inspections",
        paragraphs: [
          "Move-out notices and inspections are org/caretaker workflows that close occupancy cleanly. Completing inspections may gate deposit/financial steps depending on org process. Feature actions live under features/inspections and move-outs routes.",
        ],
      },
      {
        heading: "Tenant portal context",
        paragraphs: [
          "lib/tenant/* helpers resolve the current tenant, portal context, and dashboard aggregates. Soft-query patterns avoid taking down the entire layout when secondary widgets fail (Neon timeouts).",
        ],
      },
    ],
  },
  {
    slug: "accounting-engine",
    title: "Accounting engine — how money hits the books",
    summary:
      "Org-level chart of accounts, posting verified payments, periods, owner statements, and request workflows.",
    category: "Money",
    order: 9,
    readingMinutes: 15,
    sections: [
      {
        heading: "Scope",
        paragraphs: [
          "Accounting is org-scoped under apps/web/src/lib/accounting/*. It is not a separate deployable (services/accounting is a stub). Journals, accounts, periods, budgets, bank reconciliation, and owner statements live here.",
        ],
      },
      {
        heading: "Payment posting",
        paragraphs: [
          "After a payment is verified (gateway settle or org verify), postVerifiedPayment attempts to post into the GL. Failures should be best-effort logged — never silently roll back already-applied rent/water balances without an explicit compensating flow.",
        ],
      },
      {
        heading: "Periods & close",
        paragraphs: [
          "Period and year-end close policies prevent posting into closed periods. Owner statement generation and delivery integrate with documents/PDF and notifications (owner-statement-email).",
        ],
      },
      {
        heading: "Accounting requests",
        paragraphs: [
          "features/accounting-requests supports request workflows (e.g. payables-related staff requests) with components and actions. Treat status transitions as audited operational steps.",
        ],
      },
      {
        heading: "Key directories",
        bullets: [
          "lib/accounting/engine.ts — core posting engine",
          "lib/accounting/payments.ts — verified payment posts",
          "lib/accounting/billing.ts — rent charge accruals",
          "lib/accounting/periods.ts / period-close.ts / year-end-close.ts",
          "lib/accounting/owner-statements.ts — statements",
          "lib/accounting/bank-reconciliation.ts — bank match",
        ],
        paragraphs: [],
      },
    ],
  },
  {
    slug: "api-webhooks-cron",
    title: "Public APIs, webhooks, and cron",
    summary:
      "External entry points, secrets, PlatformControl short-circuits, and failure modes for operators.",
    category: "Integrations",
    order: 10,
    readingMinutes: 16,
    sections: [
      {
        heading: "Public vacancy API",
        paragraphs: [
          "GET /api/public/vacant-houses requires an org API key. Returns published vacancy fields only — no tenant PII, no payment data, no internal IDs beyond what is intentionally public. Powered by public-vacancy library helpers.",
        ],
      },
      {
        heading: "Webhooks",
        bullets: [
          "M-Pesa STK: /api/webhooks/mpesa (?secret=MPESA_CALLBACK_SECRET)",
          "KCB Buni IPN: dedicated KCB webhook matcher for paybill credits (lib/kcb)",
          "PlatformControl.webhooksDisabled short-circuits all inbound webhooks",
          "PlatformWebhookEvent stores samples for debugging on API explorer / health tools",
        ],
        paragraphs: [
          "When testing STK in sandbox, confirm callback URL is publicly reachable (not localhost) or use a tunnel. Production callbacks must use HTTPS and the configured shortcode/passkey pair.",
        ],
      },
      {
        heading: "Cron",
        paragraphs: [
          "Cron routes under /api/cron/* require CRON_SECRET (lib/cron/auth.ts). Jobs include notifications dispatch, owner statements, retention, and other scheduled work registered in lib/cron/jobs.ts.",
          "PlatformControl.cronDisabled blocks execution. CronJobRun records successes/failures for Jobs UI (/platform/jobs, SUPER_ADMIN).",
        ],
      },
      {
        heading: "Health & monitoring",
        paragraphs: [
          "/api/health is a lightweight liveness endpoint for uptime checks. Additional monitoring routes under /api/monitoring support ops instrumentation. Prefer these over hitting dashboard HTML for probes.",
        ],
      },
      {
        heading: "Rate limits",
        paragraphs: [
          "Proxy/middleware and lib/rate-limit enforce buckets. Platform Rate Limits UI can inspect/reset for abuse response. Tenant-admin rate limits protect sensitive admin actions.",
        ],
      },
    ],
  },
  {
    slug: "frontend-themes-pwa",
    title: "Frontend shells, themes, and PWA",
    summary:
      "How dashboards, dark mode tokens, installable PWA, offline caretaker, and shared UI primitives hang together.",
    category: "Frontend",
    order: 11,
    readingMinutes: 12,
    sections: [
      {
        heading: "Shells",
        paragraphs: [
          "Org/tenant/caretaker/landlord/platform each have layout shells with sidebar + mobile nav. Shared primitives include ed-dashboard-shell patterns (PageShell, SurfaceCard, StatCard) and platform control-plane components under platform/_components.",
          "Platform shell dual mode (admin/developer) remembers last path per mode when toggling.",
        ],
      },
      {
        heading: "Theming",
        paragraphs: [
          "CSS variables in globals.css with .dark variants. Tenant dark mode must use semantic tokens (foreground, muted, border, card). Prefer text-foreground over hardcoded slate/neutral for new UI so dark mode does not look faded or unreadable.",
          "Theme preference helpers live under lib/theme and components/theme.",
        ],
      },
      {
        heading: "PWA",
        paragraphs: [
          "manifest (manifest.ts / webmanifest), service worker (public/sw.js), install prompt components, app badge sync (lib/pwa/badge). Offline shell supports caretaker meter/issue queue patterns. Share target helpers exist for PWA share intake.",
        ],
      },
      {
        heading: "Forms & validation",
        paragraphs: [
          "react-hook-form + zod is the standard. Server Actions should re-validate with zod (never trust client-only validation). Surface user-facing errors via action-feedback helpers; log server errors with server-error-log without leaking internals.",
        ],
      },
    ],
  },
  {
    slug: "documents-storage",
    title: "Documents, receipts, and storage",
    summary:
      "Trust registry, receipt PDFs, S3-compatible storage, and public verification routes.",
    category: "Trust",
    order: 12,
    readingMinutes: 11,
    sections: [
      {
        heading: "Document registry",
        paragraphs: [
          "issueDocumentRecord (lib/documents/registry.ts) issues trust-registry serials for receipts and related documents. Public verification uses /verify-document/[code]. Lease verification uses /verify-lease/[hash].",
        ],
      },
      {
        heading: "Receipts",
        paragraphs: [
          "On successful settlement, createReceiptSnapshot + PDF helpers produce printable receipts. Receipt rows link back to Payment and DocumentRecord. Print routes under app/print/* support clean print layouts.",
        ],
      },
      {
        heading: "Object storage",
        paragraphs: [
          "lib/storage (S3-compatible via @aws-sdk/client-s3) stores photos (meter evidence, issue evidence) and document blobs. Env must include bucket/credentials for production uploads. Never store secrets in object metadata.",
        ],
      },
    ],
  },
  {
    slug: "seo-public-surface",
    title: "SEO & public surface (for operators)",
    summary:
      "What is public, what is blocked, sitemap graph, llms.txt, and how real indexing works with Search Console.",
    category: "Growth",
    order: 13,
    readingMinutes: 12,
    sections: [
      {
        heading: "Index-ready assets",
        bullets: [
          "/robots.txt → points at sitemap-index.xml",
          "Sitemaps: marketing core, vacancies, vacancy hubs, rental landings, units/properties variants",
          "/llms.txt for LLM discovery",
          "JSON-LD Organization/WebSite/SoftwareApplication/FAQ on marketing pages",
          "Canonical URLs driven by NEXT_PUBLIC_APP_URL / APP_URL",
        ],
        paragraphs: [
          "Private platform and dashboard routes are noindex and robots-disallowed. Platform-only help articles are privatePlatform and excluded from public /guides and sitemaps. System docs under /platform/developer/docs are privatePageMetadata + role gated.",
        ],
      },
      {
        heading: "Vacancy SEO pipeline",
        paragraphs: [
          "public-vacancy library builds listings, slug resolution, and sitemap entries. Caching helpers reduce DB load on high-traffic vacancy pages. Location hubs under /vacancies/[location] are first-class SEO surfaces.",
        ],
      },
      {
        heading: "Operator action for real indexing",
        paragraphs: [
          "In Google Search Console verify the production domain and submit https://estatedesk.co.ke/sitemap-index.xml (or your production host). Optionally Bing Webmaster Tools. Code cannot force Google to index every URL; 'index-ready' means robots/sitemaps/canonicals/metadata are correct, not that ranks are guaranteed.",
        ],
      },
      {
        heading: "Common SEO foot-guns",
        paragraphs: [
          "NEXT_PUBLIC_APP_URL set to localhost in production → broken canonicals and sitemap hosts.",
          "Accidentally adding privatePlatform guides without the flag → public leak.",
          "Blocking assets needed for rendering in robots.txt → avoid over-blocking.",
        ],
      },
    ],
  },
  {
    slug: "prisma-resilience",
    title: "Prisma, Neon, and resilience patterns",
    summary:
      "Pool settings, SSL uselibpqcompat, soft-fail layouts, retries, and how empty Prisma errors usually mean timeouts.",
    category: "Data",
    order: 14,
    readingMinutes: 14,
    sections: [
      {
        heading: "Client construction",
        paragraphs: [
          "apps/web/src/lib/prisma.ts creates PrismaClient with PrismaPg adapter. dns.setDefaultResultOrder('ipv4first') reduces some IPv6 path issues. Dev caches client on globalThis with a PRISMA_SCHEMA_VERSION bump key so schema changes recreate the client.",
        ],
      },
      {
        heading: "Pool & timeouts",
        paragraphs: [
          "Defaults: PRISMA_POOL_MAX=5, connection timeout 20s, idle 20s, query 30s. Neon free/pooler is sensitive to large pools and connection storms from Promise.all over many heavy queries.",
        ],
      },
      {
        heading: "SSL / uselibpqcompat",
        paragraphs: [
          "getDatabaseUrl() in config normalizes SSL for Neon so sslmode=require does not hang on verify-full with node-pg. If you see mysterious connection hangs after URL changes, re-check uselibpqcompat and pooler vs direct URL usage.",
        ],
      },
      {
        heading: "Soft-fail & retry patterns",
        paragraphs: [
          "Tenant and some org portal layouts soft-fail optional widgets so a secondary query timeout does not 500 the entire shell. retryTransientDatabaseOperation (lib/db/retry + db-kit) wraps critical paths that can safely retry.",
          "Empty PrismaClientKnownRequestError messages in logs often map to ETIMEDOUT / connection issues rather than application validation errors.",
        ],
      },
      {
        heading: "Migrations in production",
        paragraphs: [
          "Always: prisma migrate status → migrate deploy on release. If a migration was applied manually, resolve with prisma migrate resolve --applied <name> only after verifying columns/tables exist. Never reset production databases.",
        ],
      },
    ],
  },
  {
    slug: "issues-field-ops",
    title: "Issues, SLA, and caretaker field ops",
    summary:
      "Issue tickets, SLA badges, share routing, and how caretaker unit scope constrains field work.",
    category: "Ops",
    order: 15,
    readingMinutes: 10,
    sections: [
      {
        heading: "Issue tickets",
        paragraphs: [
          "IssueTicket models tenant/org/caretaker maintenance work. features/issues and lib/issues/sla.ts drive SLA badges and urgency. Share routing (share-routing.ts) helps deep-link issues into the correct persona shell.",
        ],
      },
      {
        heading: "Caretaker constraints",
        paragraphs: [
          "Caretakers are unit-scoped. Any new caretaker feature must filter by getCaretakerAllowedUnitIds. Do not expose org-wide queues to caretaker roles.",
        ],
      },
      {
        heading: "Photos & evidence",
        paragraphs: [
          "Uploads go through storage helpers with image payload validation. Evidence is critical for water disputes and issue resolution — preserve orgId scoping on every object key path.",
        ],
      },
    ],
  },
  {
    slug: "ops-incident-runbook",
    title: "Ops runbook — incidents and recovery",
    summary:
      "What to check when payments fail, DB times out, portals misbehave, or webhooks go silent.",
    category: "Ops",
    order: 16,
    readingMinutes: 16,
    sections: [
      {
        heading: "Severity triage",
        paragraphs: [
          "P1: payments not settling globally, all portals down, data corruption risk. P2: single org broken, STK for one shortcode failing. P3: cosmetic UI, single notification channel. Use PlatformControl carefully — maintenanceMode is a blunt instrument.",
        ],
      },
      {
        heading: "Neon / Prisma timeouts",
        paragraphs: [
          "Empty PrismaClientKnownRequestError often means ETIMEDOUT to pooler. Check Neon status, connection string (pooler + uselibpqcompat), pool size (default max 5), and concurrent Promise.all storms on dashboard layouts.",
          "Mitigations: reduce parallel heavy queries, soft-fail optional widgets, raise timeouts only after understanding load, scale Neon plan if sustained.",
        ],
      },
      {
        heading: "Payments stuck PENDING",
        paragraphs: [
          "Manual payments require org verification by design. Gateway STK should auto-settle — check webhook logs, PlatformControl.webhooksDisabled, callback URL, CheckoutRequestID match, Daraja credentials, and PlatformWebhookEvent samples.",
        ],
      },
      {
        heading: "Balances wrong after payment",
        paragraphs: [
          "Inspect Payment row (amount, targetType, verificationStatus, gatewayStatus, FKs). Check PaymentAllocation lines for rent. Check WaterBill.amountPaid/balance. Re-run mental model: combined allocate is rent-then-water. Do not hand-edit production balances without an audited compensating payment/adjustment process.",
        ],
      },
      {
        heading: "Migrations stuck",
        paragraphs: [
          "npx prisma migrate status / deploy. If a migration was applied manually, resolve with prisma migrate resolve --applied <name> after verifying columns/tables exist. Take a backup before risky DDL.",
        ],
      },
      {
        heading: "Useful UI & scripts",
        bullets: [
          "/platform/system-health — queues, payments, integrations",
          "/platform/jobs — cron failures (SUPER_ADMIN)",
          "/platform/api-explorer — external endpoints catalog",
          "/platform/control — kill switches (SUPER_ADMIN)",
          "/platform/developer/docs — this documentation",
          "npm run backup:database / backup:validate / restore:drill",
          "curl /api/health for uptime probes",
        ],
        paragraphs: [],
      },
    ],
  },
  {
    slug: "developer-tooling-map",
    title: "Developer portal tooling map",
    summary:
      "What each developer-mode nav item is for, who can open it, and how it maps to runtime systems.",
    category: "Platform",
    order: 17,
    readingMinutes: 10,
    sections: [
      {
        heading: "Tools",
        bullets: [
          "Developer Home — ops snapshot (API keys, notification queues, failed payments, cron fails) + tool grid",
          "System Docs — this private deep documentation (you are here)",
          "Website Control — kill switches / nuclear (SUPER_ADMIN)",
          "System Health — queues, payments, integrations",
          "API & Webhooks — catalog of external endpoints",
          "API Keys — credentials vault (SUPER_ADMIN)",
          "Feature Flags — org capabilities + global overrides",
          "Jobs & Queues — cron runs (SUPER_ADMIN)",
          "Rate Limits — buckets and resets",
          "Data / Backups — exports, retention, drill evidence (SUPER_ADMIN)",
          "Help — shorter platform operator guides",
          "Security / Audit Logs — dual-mode investigation",
        ],
        paragraphs: [],
      },
      {
        heading: "Access matrix",
        paragraphs: [
          "PLATFORM_ADMIN: developer home, health, API explorer, flags, rate limits, system docs, help, security, audit. SUPER_ADMIN: all of the above plus website control, API keys, jobs, data management, backups. Support Access is available to both platform roles under Admin mode.",
        ],
      },
      {
        heading: "Source files",
        bullets: [
          "platform/_lib/nav.ts — developerNavItems / adminNavItems",
          "platform/developer/page.tsx — home snapshot",
          "lib/platform/system-docs.ts — articles source of truth",
          "platform/developer/docs/* — hub + [slug] renderers",
          "lib/platform/control.ts — PlatformControl helpers",
        ],
        paragraphs: [],
      },
    ],
  },
  {
    slug: "end-to-end-scenarios",
    title: "End-to-end scenarios — follow the data",
    summary:
      "Walk through the most important product journeys with tables touched and side effects fired.",
    category: "Foundation",
    order: 18,
    readingMinutes: 18,
    sections: [
      {
        heading: "Scenario A — New org staff day",
        paragraphs: [
          "User logs in → UserSession created/updated → activeOrgId set from membership → org shell loads portfolio widgets → org-scoped Prisma queries only. Feature flags + subscription gates may hide modules.",
        ],
      },
      {
        heading: "Scenario B — Tenant pays rent+water via STK",
        paragraphs: [
          "Tenant opens invoice → getPeriodBillForTenant builds PERIOD_BILL → Pay Now → startTenantPayment creates Payment (COMBINED, gateway) → STK push → webhook success → settleGatewayPayment → allocateCombinedPeriodPayment updates RentCharge then WaterBill → receipt + DocumentRecord → accounting post → notifyRecipients → tenant UI shows paid/partial.",
        ],
      },
      {
        heading: "Scenario C — Tenant pastes M-Pesa code (manual)",
        paragraphs: [
          "Same period bill → manual method → Payment PENDING → org payments queue → verifyTenantPaymentAction → same allocation/receipt/notify path as gateway settle, but verification is human-gated.",
        ],
      },
      {
        heading: "Scenario D — Caretaker water read to tenant bill",
        paragraphs: [
          "Caretaker submits reading for allowed unit → MeterReading SUBMITTED + WaterBill PENDING_APPROVAL → org approves → WaterBill ISSUED → next tenant period bill includes water line → payment scenarios B/C apply.",
        ],
      },
      {
        heading: "Scenario E — Platform kill switch",
        paragraphs: [
          "SUPER_ADMIN enables tenantPortalsDisabled on PlatformControl → tenant layouts redirect to maintenance → platform operators still access /platform to investigate → disable switch after fix. WebhooksDisabled similarly freezes STK settlement until re-enabled.",
        ],
      },
      {
        heading: "Scenario F — Support access into an org",
        paragraphs: [
          "Platform admin opens support access → selects org + reason + duration → signed cookie set → org shell shows amber banner → actions are AUDITED as support session → leave clears cookie. Never share passwords.",
        ],
      },
    ],
  },
  {
    slug: "coding-conventions",
    title: "Coding conventions for this monorepo",
    summary:
      "Practical rules for contributors: scoping, file placement, docs updates, and what not to do.",
    category: "Platform",
    order: 19,
    readingMinutes: 10,
    sections: [
      {
        heading: "Hard rules",
        bullets: [
          "Always filter by orgId for operational data",
          "Use existing guards — do not invent parallel auth",
          "Server Actions re-validate with zod",
          "Prefer semantic theme tokens (foreground/muted/border)",
          "Never put private platform docs into public guides without privatePlatform",
          "Do not extract microservices without an ops reason and event boundary",
          "Do not hand-edit production money balances without audited compensating entries",
        ],
        paragraphs: [],
      },
      {
        heading: "When you change behavior, update docs",
        paragraphs: [
          "Payment settlement rules, architecture phase, auth model, or SEO public surface changes should update: README.md, docs/PROJECT_DOCUMENTATION.md, and this file (system-docs.ts). Keep the three aligned.",
        ],
      },
      {
        heading: "Tests worth adding",
        paragraphs: [
          "SEO/sitemap/guides unit tests when changing public surface. Payment allocation unit tests when touching ledger. Integration tests when changing auth or multi-tenant isolation. Prefer focused tests over giant snapshots.",
        ],
      },
      {
        heading: "Repo scripts",
        bullets: [
          "npm run dev | build | start | lint | typecheck",
          "npm run test | test:integration",
          "npm run seed",
          "npm run backup:database | backup:validate | restore:drill",
        ],
        paragraphs: [],
      },
    ],
  },
];

export function getSystemDocArticles() {
  return [...systemDocArticles].sort((a, b) => a.order - b.order);
}

export function getSystemDocBySlug(slug: string) {
  return systemDocArticles.find((article) => article.slug === slug) ?? null;
}

export function getSystemDocCategories() {
  const articles = getSystemDocArticles();
  const categories = Array.from(new Set(articles.map((a) => a.category)));
  return categories.map((category) => ({
    category,
    articles: articles.filter((a) => a.category === category),
  }));
}
