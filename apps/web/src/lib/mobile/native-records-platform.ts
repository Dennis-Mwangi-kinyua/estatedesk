




import "server-only";

import { getProductionReadinessReport } from "@/lib/ops/production-readiness";
import { platformEndpointDocs } from "./platform-endpoint-docs";
import { getGlobalSearchResults } from "@/app/(app)/platform/search/_lib/queries";
import type { AppSession } from "@/lib/auth/session";
import type { MobileWorkspaceKind, NativeWorkspaceRecord } from "@estatedesk/contracts/mobile";
import { prisma } from "@/lib/prisma";


import { AGREEMENT_ENTITY } from "@/lib/service-agreements/contract";


import { getRuntimeEnvReport } from "@/lib/config/env";
import { getIntegrationReadinessReport } from "@/lib/integrations";





import { getUserOrganizationGroups, userOrganizationWhere } from "@/lib/platform/user-organization-groups";


import { card } from "./native-records-display";
export async function nativePlatformRecords(session: AppSession, kind: MobileWorkspaceKind, path: string, q: string, page: number, recordId?: string, organization?: string): Promise<{ records: NativeWorkspaceRecord[]; notice?: string; searchable?: boolean; hasMore?: boolean } | undefined> {
  const limit = { skip: (page - 1) * 25, take: 26 };
  const newest = [{ createdAt: "desc" as const }, { id: "desc" as const }];
  const contains = { contains: q, mode: "insensitive" as const };
  const section = path === "/api-keys" ? "api-keys" : path.replace(kind === "platform" ? /^\/platform\/?/ : kind === "landlord" ? /^\/dashboard\/landlord\/?/ : /^\/dashboard\/org\/?/, "");
if (kind === "platform") {
    switch (section) {
      case "organizations": case "support-access": {
        const rows = await prisma.organization.findMany({ where: { deletedAt: null, ...(q ? { name: contains } : {}) }, ...limit, orderBy: newest, select: { id: true, name: true, slug: true, status: true, blacklistedAt: true, blacklistReason: true, email: true, phone: true, address: true, currencyCode: true, timezone: true, createdAt: true,
          subscription: { select: { plan: true, status: true, currentPeriodEnd: true } },
          documentRecords: { where: { entityType: AGREEMENT_ENTITY, status: { in: ["DRAFT", "ISSUED", "COMPLETED"] } }, orderBy: newest, take: 1, select: { id: true } },
          _count: { select: { properties: { where: { deletedAt: null } }, tenants: { where: { deletedAt: null } }, memberships: { where: { deactivatedAt: null } } } } } });
        return { records: rows.map(row => { const record = card(row.id, row.name, row.blacklistedAt ? "BLACKLISTED" : row.status, { "Blacklist lock": row.blacklistedAt, "Blacklist reason": row.blacklistReason, Email: row.email, Phone: row.phone, Address: row.address, Slug: row.slug,
          Currency: row.currencyCode, Timezone: row.timezone, Properties: row._count.properties, Tenants: row._count.tenants, "Active memberships": row._count.memberships,
          Plan: row.subscription?.plan, "Subscription status": row.subscription?.status, Renewal: row.subscription?.currentPeriodEnd, Registered: row.createdAt });
          record.links = [{ title: "DPA agreement", path: "/platform/agreements", ...(row.documentRecords?.[0] ? { recordId: row.documentRecords[0].id } : {}), emoji: "🤝", description: "Review service terms, signatures and agreement actions." }];
          return record; }) };
      }
      case "feature-flags": {
        const rows = await prisma.organization.findMany({ where: { deletedAt: null, ...(q ? { name: contains } : {}) }, ...limit, orderBy: newest, select: { id: true, name: true, settings: { select: { features: true } } } });
        return { records: rows.map(row => card(row.id, row.name, undefined, { "Configured features": JSON.stringify(row.settings?.features ?? {}, null, 2) })) };
      }
      case "permissions": {
        const rows = await prisma.platformPermission.findMany({ where: q ? { user: { fullName: contains } } : {}, ...limit, orderBy: newest, select: { id: true, permission: true, granted: true, user: { select: { fullName: true } } } });
        return { records: rows.map(row => card(row.id, row.user.fullName, row.granted ? "GRANTED" : "DENIED", { Permission: row.permission })) };
      }
      case "service-providers/reports": {
        const rows = await prisma.providerReport.findMany({ where: { resolvedAt: null, ...(q ? { OR: [{ reason: contains }, { provider: { businessName: contains } }] } : {}) }, ...limit, orderBy: newest,
          select: { id: true, reason: true, createdAt: true, provider: { select: { businessName: true, status: true } }, org: { select: { name: true } }, job: { select: { title: true } } } });
        return { records: rows.map(row => card(`report:${row.id}`, row.provider.businessName, "REPORT_PENDING", { Organization: row.org.name, Job: row.job.title, Reason: row.reason, "Provider status": row.provider.status, Reported: row.createdAt })) };
      }
      case "service-providers": {
        const rows = await prisma.serviceProvider.findMany({ where: q ? { businessName: contains } : {}, ...limit, orderBy: newest, select: { id: true, businessName: true, category: true, location: true, status: true, available: true, lastSeenAt: true } });
        return { records: rows.map(row => card(row.id, row.businessName, row.status, { Category: row.category, Location: row.location, Available: row.available, "Last seen": row.lastSeenAt })) };
      }
      case "settings": {
        const checks = getRuntimeEnvReport().checks.filter(check => !q || check.label.toLowerCase().includes(q.toLowerCase()));
        return { records: checks.slice(limit.skip, limit.skip + limit.take).map(check => card(check.key, check.label, check.status.toUpperCase(), { Group: check.group, Importance: check.importance })) };
      }
      case "api-explorer": {
        const providers = getIntegrationReadinessReport().integrations.map(provider => card(`integration:${provider.id}`, provider.name, provider.status, { Category: provider.category, Region: provider.region, "Next step": provider.nextAction }));
        const endpoints = platformEndpointDocs.map(endpoint => card(`endpoint:${endpoint.path}`, `${endpoint.method} ${endpoint.path}`, undefined, { Group: endpoint.group, Authentication: endpoint.auth, Purpose: endpoint.purpose }));
        const records = [...endpoints, ...providers].filter(record => !q || JSON.stringify(record).toLowerCase().includes(q.toLowerCase()));
        return { records: records.slice(limit.skip, limit.skip + limit.take) };
      }
      case "rate-limits": {
        const rows = await prisma.rateLimitBucket.findMany({ where: { resetAt: { gt: new Date() } }, ...limit, orderBy: { resetAt: "desc" }, select: { key: true, count: true, resetAt: true } });
        return { records: rows.map(row => card(row.key, row.key, "ACTIVE", { Requests: row.count, Reset: row.resetAt })), searchable: false };
      }
      case "search": {
        const result = await getGlobalSearchResults(q);
        if (!result.hasQuery) return { records: [], notice: "Enter at least two characters to search organizations, accounts, tenants, units and payment references." };
        const records = [
          ...result.orgs.map(row => card(`org:${row.id}`, row.name, row.status, { Type: "Organization", Slug: row.slug, Updated: row.updatedAt })),
          ...result.users.map(row => card(`user:${row.id}`, row.fullName, undefined, { Type: "Account", Email: row.email, Phone: row.phone, Username: row.username, Role: row.platformRole, Updated: row.updatedAt })),
          ...result.tenants.map(row => card(`tenant:${row.id}`, row.fullName, row.status, { Type: "Tenant", Organization: row.org.name, Phone: row.phone, Updated: row.updatedAt })),
          ...result.payments.map(row => card(`payment:${row.id}`, row.reference ?? row.externalReference ?? "Payment", row.gatewayStatus, { Type: "Payment", Organization: row.org.name, Amount: row.amount, Target: row.targetType, "External reference": row.externalReference, Checkout: row.checkoutRequestId, Created: row.createdAt })),
          ...result.units.map(row => card(`unit:${row.id}`, `${row.property.name} · ${row.houseNo}`, row.status, { Type: "Unit", Organization: row.property.org.name, Updated: row.updatedAt })),
        ];
        return { records: records.slice(limit.skip, limit.skip + limit.take), notice: "Up to 10 matches per resource type. Refine your search for more specific results." };
      }
      case "reports": {
        const [organizationStates, subscriptionStates, issueStates, notificationStates, payments] = await Promise.all([
          prisma.organization.groupBy({ by: ["status"], where: { deletedAt: null }, _count: { _all: true } }),
          prisma.subscription.groupBy({ by: ["status"], where: { org: { deletedAt: null } }, _count: { _all: true } }),
          prisma.issueTicket.groupBy({ by: ["status"], where: { org: { deletedAt: null }, status: { in: ["OPEN", "IN_PROGRESS"] } }, _count: { _all: true } }),
          prisma.notification.groupBy({ by: ["status"], where: { org: { deletedAt: null }, status: { in: ["QUEUED", "FAILED"] } }, _count: { _all: true } }),
          prisma.payment.findMany({ where: { org: { deletedAt: null } }, take: 500, orderBy: newest, select: { amount: true, gatewayStatus: true, verificationStatus: true, reversedAt: true, createdAt: true, org: { select: { currencyCode: true } } } }),
        ]);
        const count = (rows: { status: string; _count: { _all: number } }[], status: string) => rows.find(row => row.status === status)?._count._all ?? 0;
        const verified = payments.filter(payment => payment.gatewayStatus === "SUCCESS" && !payment.reversedAt && ["VERIFIED", "NOT_REQUIRED"].includes(payment.verificationStatus));
        const volume = new Map<string, number>();
        for (const payment of verified) volume.set(payment.org.currencyCode, (volume.get(payment.org.currencyCode) ?? 0) + Number(payment.amount));
        const updated = new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi", dateStyle: "medium", timeStyle: "short" });
        const records = [
          card("organizations", "Organizations", undefined, { Total: organizationStates.reduce((sum, row) => sum + row._count._all, 0), Active: count(organizationStates, "ACTIVE"), Suspended: count(organizationStates, "SUSPENDED"), Disabled: count(organizationStates, "DISABLED"), Updated: updated }, "All organizations that have not been deleted."),
          card("subscriptions", "Subscription health", undefined, { Active: count(subscriptionStates, "ACTIVE"), Trialing: count(subscriptionStates, "TRIALING"), "Past due": count(subscriptionStates, "PAST_DUE"), Cancelled: count(subscriptionStates, "CANCELLED"), Expired: count(subscriptionStates, "EXPIRED"), Updated: updated }, "Current subscription statuses across organizations."),
          card("payment-volume", "Recent payment activity", undefined, { "Payments sampled": payments.length, "Verified successful": verified.length, "Failed payments": payments.filter(payment => payment.gatewayStatus === "FAILED").length, ...Object.fromEntries([...volume].sort(([a], [b]) => a.localeCompare(b)).map(([currency, amount]) => [`Verified volume · ${currency}`, new Intl.NumberFormat("en-KE", { style: "currency", currency }).format(amount)])), ...(volume.size ? {} : { "Verified volume": "No verified successful payments in this sample" }), Updated: updated }, "Latest 500 payments, not an all-time total. Amounts include verified successful payments only, exclude reversals, and stay separate by currency."),
          card("issues", "Maintenance workload", undefined, { "Needs attention": count(issueStates, "OPEN") + count(issueStates, "IN_PROGRESS"), Open: count(issueStates, "OPEN"), "In progress": count(issueStates, "IN_PROGRESS"), Updated: updated }, "Current open and in-progress maintenance tickets."),
          card("notifications", "Notification delivery", undefined, { Queued: count(notificationStates, "QUEUED"), Failed: count(notificationStates, "FAILED"), Updated: updated }, "Current delivery backlog and failed notifications across channels."),
        ];
        return { records: records.slice(limit.skip, limit.skip + limit.take), searchable: false, notice: "Current platform snapshot. Payment activity is a sample of the latest 500 payments; it is not total platform revenue. Times use Africa/Nairobi." };
      }
      case "users": case "admins": {
        if (section === "users" && !organization && !recordId) {
          const result = await getUserOrganizationGroups({ deletedAt: null }, q, page, 25, true);
          return { records: result.groups.map(group => ({ ...card(group.id, group.name, undefined, { Users: group.count }, group.slug || "Accounts without an active organization"), organizationGroup: group.id })), notice: "Choose an organization to view its users. People with multiple organizations appear in each group." };
        }
        const rows = await prisma.user.findMany({ where: { deletedAt: null, ...(recordId ? { id: recordId } : {}), ...(section === "users" ? userOrganizationWhere(organization) : {}), ...(section === "admins" ? { platformRole: { in: ["SUPER_ADMIN", "PLATFORM_ADMIN"] as ("SUPER_ADMIN" | "PLATFORM_ADMIN")[] } } : {}), ...(!recordId && q ? { OR: [{ fullName: contains }, { email: contains }, { username: contains }, { phone: contains }] } : {}) }, skip: recordId ? 0 : limit.skip, take: recordId ? 1 : limit.take, orderBy: newest,
          select: { identityClaims: recordId ? { select: { number: true }, orderBy: { createdAt: "asc" } } : false, id: true, fullName: true, username: true, email: true, phone: true, status: true, platformRole: true, lastLoginAt: true, twoFactorEnabled: true, createdAt: true,
            emailVerified: true, phoneVerified: true, mustChangePassword: true,
            memberships: { where: { deactivatedAt: null, org: { deletedAt: null } }, take: 10, orderBy: { createdAt: "desc" }, select: { role: true, scopeType: true, org: { select: { name: true } } } },
            _count: { select: { memberships: { where: { deactivatedAt: null, org: { deletedAt: null } } } } } } });
        return { records: rows.map(row => card(row.id, row.fullName, row.status, { "User ID": row.id, ...(recordId ? { "National ID": row.identityClaims?.map(claim => claim.number).join(", ") || "Not recorded" } : {}), Email: row.email, Phone: row.phone, Username: row.username, Role: row.platformRole,
          "Two-factor enabled": row.twoFactorEnabled, "Email verified": !!row.emailVerified, "Phone verified": !!row.phoneVerified, "Password change required": row.mustChangePassword,
          "Active memberships": row._count.memberships, ...Object.fromEntries(row.memberships.map((membership, index) => [`Workspace ${index + 1}`, `${membership.org.name} · ${membership.role} · ${membership.scopeType}`])),
          "Last login": row.lastLoginAt, Registered: row.createdAt })) };
      }
      case "subscriptions": case "billing": {
        const rows = await prisma.subscription.findMany({ where: q ? { org: { name: contains } } : {}, ...limit, orderBy: newest, select: { id: true, plan: true, status: true, currentPeriodStart: true, currentPeriodEnd: true, billingEmail: true, trialStartsAt: true, trialEndsAt: true, cancelAt: true, cancelledAt: true, org: { select: { name: true, currencyCode: true } } } });
        return { records: rows.map(row => card(row.id, row.org.name, row.status, { Plan: row.plan, "Billing email": row.billingEmail, Currency: row.org.currencyCode,
          Start: row.currentPeriodStart, Renewal: row.currentPeriodEnd, "Trial start": row.trialStartsAt, "Trial end": row.trialEndsAt, "Cancellation scheduled": row.cancelAt, Cancelled: row.cancelledAt })) };
      }
      case "audit-logs": case "security": {
        const rows = await prisma.auditLog.findMany({ where: { ...(q ? { action: contains } : {}), ...(section === "security" ? { OR: ["LOGIN", "LOGOUT", "DENIED", "PASSWORD", "SESSION", "PERMISSION"].map(value => ({ action: { contains: value, mode: "insensitive" as const } })) } : {}) }, ...limit, orderBy: newest,
          select: { id: true, action: true, entityType: true, createdAt: true, actor: { select: { fullName: true } }, org: { select: { name: true } } } });
        return { records: rows.map(row => card(row.id, row.action, undefined, { Actor: row.actor.fullName, Entity: row.entityType, Organization: row.org?.name, Date: row.createdAt })) };
      }
      case "system-health": {
        const report = await getProductionReadinessReport();
        const records = report.checks.filter(check => !q || `${check.label} ${check.detail}`.toLowerCase().includes(q.toLowerCase())).map(check => card(check.id, check.label, check.status.toUpperCase(), { Detail: check.detail, Blocking: check.blocking }));
        return { records: records.slice(limit.skip, limit.skip + limit.take) };
      }
      case "jobs/notifications": {
        const rows = await prisma.notification.findMany({ where: { status: { in: ["QUEUED", "FAILED"] }, ...(q ? { title: contains } : {}) }, ...limit, orderBy: newest,
          select: { id: true, title: true, status: true, channel: true, message: true, createdAt: true, org: { select: { name: true } } } });
        return { records: rows.map(row => card(row.id, row.title, row.status, { Organization: row.org.name, Channel: row.channel, Message: row.message, Created: row.createdAt })) };
      }
      case "jobs": {
        const rows = await prisma.cronJobRun.findMany({ where: q ? { jobName: contains } : {}, ...limit, orderBy: [{ startedAt: "desc" }, { id: "desc" }], select: { id: true, jobName: true, status: true, startedAt: true, finishedAt: true, processedCount: true, successCount: true, failedCount: true } });
        return { records: rows.map(row => card(row.id, row.jobName, row.status, { Started: row.startedAt, Finished: row.finishedAt, Processed: row.processedCount, Successful: row.successCount, Failed: row.failedCount })) };
      }
      case "messages": {
        const rows = await prisma.platformMessage.findMany({ where: q ? { subject: contains } : {}, ...limit, orderBy: newest, select: { id: true, subject: true, message: true, status: true, createdAt: true, org: { select: { name: true } } } });
        return { records: rows.map(row => card(row.id, row.subject, row.status, { Organization: row.org.name, Message: row.message, Sent: row.createdAt })) };
      }
      case "onboarding": {
        const rows = await prisma.onboardingRequest.findMany({ where: q ? { companyName: contains } : {}, ...limit, orderBy: newest, select: { id: true, companyName: true, fullName: true, workEmail: true, status: true, createdAt: true } });
        return { records: rows.map(row => card(row.id, row.companyName, row.status, { Contact: row.fullName, Email: row.workEmail, Received: row.createdAt })) };
      }
      case "marketing": {
        const rows = await prisma.platformMarketer.findMany({ where: { deletedAt: null, ...(q ? { fullName: contains } : {}) }, ...limit, orderBy: newest, select: { id: true, fullName: true, status: true, referralCode: true, email: true } });
        return { records: rows.map(row => card(row.id, row.fullName, row.status, { Email: row.email, "Referral code": row.referralCode })) };
      }
      case "expenditures": {
        const rows = await prisma.expenditure.findMany({ where: { scope: "PLATFORM", ...(q ? { description: contains } : {}) }, ...limit, orderBy: newest, select: { id: true, description: true, status: true, amount: true, currencyCode: true, category: true, incurredAt: true } });
        return { records: rows.map(row => card(row.id, row.description, row.status, { Amount: `${row.currencyCode} ${row.amount}`, Category: row.category, Date: row.incurredAt })) };
      }
      case "payments": case "payment-ops": {
        const rows = await prisma.payment.findMany({ where: q ? { reference: contains } : {}, ...limit, orderBy: newest, select: { id: true, amount: true, reference: true, method: true, gatewayStatus: true, verificationStatus: true, reconciliationStatus: true, createdAt: true, org: { select: { name: true, currencyCode: true } } } });
        return { records: rows.map(row => card(row.id, row.reference ?? "Awaiting reference", row.verificationStatus, { Organization: row.org.name, Amount: `${row.org.currencyCode} ${row.amount}`, Method: row.method, Gateway: row.gatewayStatus, Reconciliation: row.reconciliationStatus, Created: row.createdAt })) };
      }
      case "data-management": {
        const rows = await prisma.dataExportRequest.findMany({ where: q ? { org: { name: contains } } : {}, ...limit, orderBy: newest, select: { id: true, status: true, reason: true, requestedAt: true, reviewedAt: true, expiresAt: true, org: { select: { name: true } } } });
        return { records: rows.map(row => card(row.id, row.org.name, row.status, { Reason: row.reason, Requested: row.requestedAt, Reviewed: row.reviewedAt, Expires: row.expiresAt })) };
      }
      case "broadcasts": {
        const rows = await prisma.notification.findMany({ where: { type: "GENERAL", ...(q ? { OR: [{ title: contains }, { org: { name: contains } }] } : {}) }, ...limit, orderBy: newest,
          select: { id: true, title: true, message: true, channel: true, status: true, createdAt: true, org: { select: { name: true } }, user: { select: { fullName: true } }, tenant: { select: { fullName: true } } } });
        return { records: rows.map(row => card(row.id, row.title, row.status, { Organization: row.org.name, Recipient: row.user?.fullName ?? row.tenant?.fullName ?? "Organization", Channel: row.channel, Message: row.message, Created: row.createdAt })) };
      }
      case "backups": case "control": {
        const row = await prisma.platformControl.findUnique({ where: { id: "global" }, select: { lastBackupAt: true, lastBackupStatus: true, lastBackupNote: true, maintenanceMode: true, incidentMode: true, publicSignupDisabled: true, cronDisabled: true } });
        return { records: row ? [card("global", section === "backups" ? "Backup checkpoint" : "Platform controls", row.lastBackupStatus ?? undefined, section === "backups" ? { "Last backup": row.lastBackupAt, Note: row.lastBackupNote } : { Maintenance: row.maintenanceMode, Incident: row.incidentMode, "Signup disabled": row.publicSignupDisabled, "Scheduled jobs disabled": row.cronDisabled })] : [], searchable: false };
      }
    }
  }
return undefined;
}
