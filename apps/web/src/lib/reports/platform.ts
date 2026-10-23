import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canViewAuditLogs } from "@/lib/permissions/access";
import type { AppSession } from "@/lib/auth/session";
import { reportFiltersSchema, type ReportFilters, type NativeWorkspaceRecord, type ReportMetadata } from "@estatedesk/contracts/mobile";
import { reportPeriod, trend } from "./period";

type Count = { orgId: string; _count: { _all: number } };
type Money = Count & { _sum: { amount: Prisma.Decimal | null } };
const total = (rows: Count[]) => rows.reduce((sum, row) => sum + row._count._all, 0);
const inOrg = <T extends { orgId: string }>(rows: T[], id: string) => rows.filter(row => row.orgId === id);
const countFor = (rows: Count[], id: string) => total(inOrg(rows, id));
const moneyFor = (rows: Money[], id: string) => inOrg(rows, id).reduce((sum, row) => sum.plus(row._sum.amount ?? 0), new Prisma.Decimal(0));
export class ReportAccessError extends Error {}
export class ReportExportLimitError extends Error {}

export async function platformReport(session: Pick<AppSession, "platformRole">, input: ReportFilters, exporting = false) {
  if (!canViewAuditLogs(session.platformRole)) throw new ReportAccessError("Platform administrator access is required.");
  const filters = reportFiltersSchema.parse(input);
  const now = new Date();
  const period = reportPeriod(filters, now);
  const result = await prisma.$transaction(async tx => {
    const org = { deletedAt: null, ...(filters.organization ? { id: filters.organization } : {}) };
    const base = { org };
    const verified = { gatewayStatus: "SUCCESS" as const, verificationStatus: { in: ["VERIFIED", "NOT_REQUIRED"] as ("VERIFIED" | "NOT_REQUIRED")[] }, reversedAt: null };
    const window = async (createdAt: { gte: Date; lt: Date }) => {
      const [subscriptions, payments, issues, notifications] = await Promise.all([
        tx.subscription.groupBy({ by: ["orgId", "status"], where: { ...base, createdAt }, _count: { _all: true } }),
        tx.payment.groupBy({ by: ["orgId"], where: { ...base, ...verified, createdAt }, _count: { _all: true }, _sum: { amount: true } }),
        tx.issueTicket.groupBy({ by: ["orgId", "status"], where: { ...base, createdAt, status: { in: ["OPEN", "IN_PROGRESS"] } }, _count: { _all: true } }),
        tx.notification.groupBy({ by: ["orgId", "status"], where: { ...base, createdAt, status: { in: ["QUEUED", "FAILED"] } }, _count: { _all: true } }),
      ]);
      return { subscriptions, payments, issues, notifications };
    };
    const [organizations, current, previous, overdueSubscriptions, oldIssues, failedNotifications] = await Promise.all([
      tx.organization.findMany({ where: org, orderBy: [{ name: "asc" }, { id: "asc" }], select: { id: true, name: true, currencyCode: true, createdAt: true } }),
      window(period.current), window(period.previous),
      tx.subscription.groupBy({ by: ["orgId"], where: { ...base, status: "PAST_DUE" }, _count: { _all: true } }),
      tx.issueTicket.groupBy({ by: ["orgId"], where: { ...base, status: { in: ["OPEN", "IN_PROGRESS"] }, createdAt: { lt: new Date(now.getTime() - 7 * 86400000) } }, _count: { _all: true } }),
      tx.notification.groupBy({ by: ["orgId"], where: { ...base, status: "FAILED" }, _count: { _all: true } }),
    ]);
    return { organizations, current, previous, overdueSubscriptions, oldIssues, failedNotifications };
  }, { isolationLevel: "RepeatableRead", timeout: 30000 });
  const { organizations, current, previous, overdueSubscriptions, oldIssues, failedNotifications } = result;
  if (filters.organization && organizations.length === 0) throw new ReportAccessError("This organization is unavailable.");
  const created = (date: Date, range: { gte: Date; lt: Date }) => date >= range.gte && date < range.lt ? 1 : 0;
  const active = (rows: typeof current.subscriptions) => rows.filter(row => row.status === "ACTIVE");
  const queue = (rows: typeof current.notifications) => rows.filter(row => row.status === "QUEUED");
  const metrics = {
    organizations: [organizations.reduce((sum, org) => sum + created(org.createdAt, period.current), 0), organizations.reduce((sum, org) => sum + created(org.createdAt, period.previous), 0)],
    subscriptions: [total(active(current.subscriptions)), total(active(previous.subscriptions))],
    "payment-volume": [total(current.payments), total(previous.payments)],
    issues: [total(current.issues), total(previous.issues)],
    notifications: [total(queue(current.notifications)), total(queue(previous.notifications))],
    attention: [total(overdueSubscriptions) + total(oldIssues) + total(failedNotifications), 0],
  };
  const byCurrency = new Map<string, { current: Prisma.Decimal; previous: Prisma.Decimal }>();
  for (const org of organizations) {
    const value = byCurrency.get(org.currencyCode) ?? { current: new Prisma.Decimal(0), previous: new Prisma.Decimal(0) };
    value.current = value.current.plus(moneyFor(current.payments, org.id));
    value.previous = value.previous.plus(moneyFor(previous.payments, org.id));
    byCurrency.set(org.currencyCode, value);
  }
  const snapshot = now.toISOString();
  const record = (id: keyof typeof metrics, title: string, primary: string, extra: Record<string, string | number> = {}): NativeWorkspaceRecord => ({
    id, title, subtitle: id === "attention" ? "Current backlog across all dates. Categories may overlap; these are items, not unique organizations." : "Created during the selected dates; statuses reflect their current state.",
    fields: Object.entries({ [primary]: metrics[id][0], ...(id === "attention" ? {} : { "Previous period": metrics[id][1], Change: trend(metrics[id][0], metrics[id][1]) }), ...extra, "Snapshot time": snapshot }).map(([label, value]) => ({ label, value: String(value) })),
  });
  const records = [
    record("organizations", "Organizations", "Organizations created", { "Existing organizations in scope": organizations.length }),
    record("subscriptions", "Subscription health", "Active subscriptions started", { "Past due in this cohort": total(current.subscriptions.filter(row => row.status === "PAST_DUE")) }),
    record("payment-volume", "Verified payments", "Verified payment count", Object.fromEntries([...byCurrency].sort(([a], [b]) => a.localeCompare(b)).flatMap(([currency, amounts]) => [[`Verified volume · ${currency}`, amounts.current.toFixed(2)], [`Previous volume · ${currency}`, amounts.previous.toFixed(2)], [`Volume change · ${currency}`, amounts.current.minus(amounts.previous).toFixed(2)]]))),
    record("issues", "Maintenance workload", "Unresolved tickets created", { Open: total(current.issues.filter(row => row.status === "OPEN")), "In progress": total(current.issues.filter(row => row.status === "IN_PROGRESS")) }),
    record("notifications", "Notification delivery", "Queued notifications created", { "Failed in this period": total(current.notifications.filter(row => row.status === "FAILED")) }),
    record("attention", "Needs attention", "Backlog items", { "Past-due subscriptions": total(overdueSubscriptions), "Unresolved tickets older than 7 days": total(oldIssues), "Failed notifications": total(failedNotifications) }),
  ];
  const organizationRows = organizations.map(org => {
    const values = (data: typeof current, range: typeof period.current) => ({ organizations: created(org.createdAt, range), subscriptions: countFor(active(data.subscriptions), org.id), "payment-volume": countFor(data.payments, org.id), issues: countFor(data.issues, org.id), notifications: countFor(queue(data.notifications), org.id), attention: 0 });
    const attention = countFor(overdueSubscriptions, org.id) + countFor(oldIssues, org.id) + countFor(failedNotifications, org.id);
    return { id: org.id, name: org.name, current: filters.metric === "attention" ? attention : values(current, period.current)[filters.metric], previous: values(previous, period.previous)[filters.metric], attention, amounts: filters.metric === "payment-volume" ? [{ currency: org.currencyCode, current: moneyFor(current.payments, org.id).toFixed(2), previous: moneyFor(previous.payments, org.id).toFixed(2) }] : [] };
  }).filter(row => filters.organization || row.current > 0 || row.previous > 0);
  if (exporting && organizationRows.length > 5000) throw new ReportExportLimitError("Narrow the organization or date filters before exporting more than 5,000 organizations.");
  const offset = (filters.page - 1) * 25;
  const report: ReportMetadata = { generatedAt: snapshot, windowStart: period.current.gte.toISOString(), windowEnd: period.current.lt.toISOString(), previousStart: period.previous.gte.toISOString(), previousEnd: period.previous.lt.toISOString(), from: period.from, to: period.to, previousFrom: period.previousFrom, previousTo: period.previousTo, scopeName: filters.organization ? organizations[0].name : "All organizations", metric: filters.metric, organizations: exporting ? organizationRows : organizationRows.slice(offset, offset + 25), hasMore: !exporting && organizationRows.length > offset + 25 };
  return { records, report, searchable: false, notice: "Totals cover the complete selected period, not a sample. Comparisons use an equally long preceding interval. Statuses are current, not reconstructed historical states. Attention shows today's backlog across all dates. Times use Africa/Nairobi." };
}
