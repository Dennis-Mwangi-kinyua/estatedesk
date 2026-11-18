import { requireActiveSubscription } from "@/lib/billing/subscription-access";
import type { AppSession } from "@/lib/auth/session";
import type { NativeWorkspaceRecord } from "@estatedesk/contracts/mobile";
import { rentStatement } from "@/features/collections/statement";

export const RENT_STATEMENT_PATH = "/dashboard/org/collections/statement";

export async function nativeRentStatement(session: AppSession, tenantId: string | undefined, page: number) {
  await requireActiveSubscription(session.activeOrgId!);
  if (!tenantId) return { records: [], notice: "Open a collection account and choose Rent statement.", searchable: false };
  const data = await rentStatement(session, tenantId, page);
  if (!data) return { records: [], notice: "This account is unavailable.", searchable: false };
  const money = (value: unknown) => new Intl.NumberFormat("en-KE", { style: "currency", currency: data.currency }).format(Number(value ?? 0));
  const records: NativeWorkspaceRecord[] = data.charges.map(charge => ({
    id: charge.id, title: `${charge.period} · ${charge.lease.unit.property.name}`,
    subtitle: charge.lease.unit.houseNo, status: charge.status, actions: [],
    fields: [
      { label: "Due date", value: new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeZone: "Africa/Nairobi" }).format(charge.dueDate) },
      { label: "Rent charged", value: money(charge.amountDue) },
      { label: "Allocated payments", value: money(charge.amountPaid) },
      { label: "Remaining balance", value: money(charge.balance) },
    ],
  }));
  return {
    records, searchable: false, hasMore: data.page * 25 < data.count,
    notice: `${data.tenant.fullName} · ${data.count} rent charges. Charged ${money(data.totals._sum.amountDue)} · Allocated ${money(data.totals._sum.amountPaid)} · Balance ${money(data.totals._sum.balance)}. Water, deposits and unapplied cash are excluded.`,
  };
}
