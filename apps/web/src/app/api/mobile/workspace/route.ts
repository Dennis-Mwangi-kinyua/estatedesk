import type { Prisma } from "@prisma/client";
import { mobileWorkspaceKindSchema, type MobileWorkspaceDashboard } from "@estatedesk/contracts/mobile";
import { prisma } from "@/lib/prisma";
import { mobileJson } from "@/lib/mobile/api";
import { nativeRoute } from "@/lib/mobile/route";
import { mobileWorkspaceAllowed, mobileWorkspaceLinks } from "@/lib/mobile/workspace-menu";
import { mobileFeatures } from "@/lib/mobile/features";
import { reviewWhere } from "@/lib/mobile/payment-review";
import { notificationScopeForSession } from "@/lib/notifications/read";
import { getLandlordDashboardData } from "@/app/(app)/dashboard/landlord/_lib/queries";

export async function GET(request: Request) {
  return nativeRoute(request, async session => {
    const kind = mobileWorkspaceKindSchema.parse(new URL(request.url).searchParams.get("kind"));
    if (!mobileWorkspaceAllowed(session, kind)) return mobileJson({ error: "This workspace is unavailable for your account." }, 403);
    const links = mobileWorkspaceLinks(session, kind);
    if (new URL(request.url).searchParams.get("section") === "menu") return mobileJson({ kind, links, metrics: [], updates: [], partial: false, updatedAt: new Date().toISOString() });
    const allowed = (path: string) => links.some(link => link.path === path);
    if (kind === "landlord") {
      if (!session.activeOrgId || session.activeOrgRole !== "LANDLORD") return mobileJson({ error: "Landlord workspace access is unavailable." }, 403);
      const [dashboard, org] = await Promise.all([
        getLandlordDashboardData(session.activeOrgId, session.userId),
        prisma.organization.findUnique({ where: { id: session.activeOrgId }, select: { currencyCode: true } }),
      ]);
      const currency = org?.currencyCode ?? "KES";
      const root = "/dashboard/landlord";
      const metrics = dashboard ? [
        { title: "Properties", value: String(dashboard.properties.length), detail: "Assigned to your landlord profile", emoji: "🏘️", path: root },
        { title: "Occupied units", value: String(dashboard.occupiedUnits), detail: `${dashboard.vacantUnits} vacant in your portfolio`, emoji: "🏡", path: root },
        { title: "Rent collected", value: `${currency} ${dashboard.monthlyAmountPaid.toLocaleString("en-KE")}`, detail: dashboard.currentPeriod, emoji: "💳", path: "/dashboard/landlord/statements" },
        { title: "Outstanding", value: `${currency} ${dashboard.monthlyBalance.toLocaleString("en-KE")}`, detail: "Current portfolio balance", emoji: "📊", path: "/dashboard/landlord/statements" },
      ].filter(metric => allowed(metric.path)) : [];
      return mobileJson({ kind, links, metrics, updates: [], partial: false, updatedAt: new Date().toISOString() } satisfies MobileWorkspaceDashboard);
    }
    type Metric = MobileWorkspaceDashboard["metrics"][number];
    const tasks: { metric: Omit<Metric, "value">; value: Promise<number> }[] = [];
    const count = (title: string, emoji: string, path: string, value: () => Promise<number>, detail: string) => {
      if (allowed(path)) tasks.push({ metric: { title, emoji, path, detail }, value: value() });
    };
    if (kind === "platform") {
      const developer = new URL(request.url).searchParams.get("section") === "developer";
      if (developer) {
        count("Active API keys", "🔑", "/platform/api-keys", () => prisma.apiKey.count({ where: { isActive: true } }), "Enabled API credentials");
        count("Queued notifications", "📨", "/platform/jobs", () => prisma.notification.count({ where: { status: "QUEUED" } }), "Waiting for dispatch");
        count("Failed notifications", "🔔", "/platform/jobs", () => prisma.notification.count({ where: { status: "FAILED" } }), "Review and retry in Jobs");
        count("Failed jobs · 24h", "⏱️", "/platform/system-health", () => prisma.cronJobRun.count({ where: { status: "FAILED", startedAt: { gte: new Date(Date.now() - 86400000) } } }), "Scheduled jobs requiring review");
        count("Pending exports", "🗄️", "/platform/data-management", () => prisma.dataExportRequest.count({ where: { status: "PENDING" } }), "Awaiting operator review");
      } else {
      count("Organizations", "🏢", "/platform/organizations", () => prisma.organization.count({ where: { deletedAt: null } }), "Across the platform");
      count("User accounts", "👥", "/platform/users", () => prisma.user.count({ where: { deletedAt: null } }), "Accounts not deleted");
      count("Subscriptions", "💼", "/platform/subscriptions", () => prisma.subscription.count(), "All subscription records");
      count("Platform operators", "🛡️", "/platform/admins", () => prisma.user.count({ where: { deletedAt: null, platformRole: { in: ["SUPER_ADMIN", "PLATFORM_ADMIN"] } } }), "Current operator accounts");
        count("Pending ID reviews", "🪪", "/platform/identity-verification", () => prisma.identityVerificationRequest.count({ where: { status: "PENDING" } }), "Authenticate identity and consent");
      }
    } else {
      if (allowed("/dashboard/org/units")) {
        const scope = session.membershipScope;
        const where: Prisma.UnitWhereInput = { deletedAt: null, property: { orgId: session.activeOrgId!, deletedAt: null },
          ...(scope?.scopeType === "PROPERTY" ? { propertyId: scope.scopeId } : scope?.scopeType === "BUILDING" ? { buildingId: scope.scopeId } : scope?.scopeType === "UNIT" ? { id: scope.scopeId } : {}) };
        // One grouped query serves all occupancy metrics, within membership scope.
        const units = Promise.resolve(prisma.unit.groupBy({ by: ["status"], where, _count: { _all: true } }));
        count("Property units", "🚪", "/dashboard/org/units", () => units.then(rows => rows.reduce((total, row) => total + row._count._all, 0)), "Within your assigned scope");
        count("Occupied units", "🏡", "/dashboard/org/units", () => units.then(rows => rows.find(row => row.status === "OCCUPIED")?._count._all ?? 0), "Within your assigned scope");
        count("Vacant units", "🔑", "/dashboard/org/units", () => units.then(rows => rows.find(row => row.status === "VACANT")?._count._all ?? 0), "Within your assigned scope");
      }
      if (mobileFeatures(session).includes("payment-review")) count("Payments to review", "💳", "/dashboard/org/payments", () => prisma.payment.count({ where: reviewWhere(session) }), "Pending manual payments in your scope");
    }
    const updates = kind === "platform" ? prisma.organization.findMany({ where: { deletedAt: null }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 3, select: { id: true, name: true, createdAt: true } })
      .then(rows => rows.map(row => ({ id: row.id, title: row.name, message: "Organization registered", createdAt: row.createdAt.toISOString() })))
      : allowed("/dashboard/org/notifications") ? notificationScopeForSession(session).then(scope => prisma.notification.findMany({ where: { ...scope, channel: "IN_APP", status: "SENT" }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 3, select: { id: true, title: true, message: true, createdAt: true } })).then(rows => rows.map(row => ({ ...row, createdAt: row.createdAt.toISOString() }))) : Promise.resolve([]);
    const [values, recent] = await Promise.all([Promise.allSettled(tasks.map(task => task.value)), updates.then(value => ({ ok: true as const, value }), () => ({ ok: false as const, value: [] }))]);
    return mobileJson({ kind, links, metrics: tasks.map((task, index) => ({ ...task.metric, value: values[index].status === "fulfilled" ? String(values[index].value) : "—" })),
      updates: recent.value, partial: !recent.ok || values.some(value => value.status === "rejected"), updatedAt: new Date().toISOString() } satisfies MobileWorkspaceDashboard);
  });
}
