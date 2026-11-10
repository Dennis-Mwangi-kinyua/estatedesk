import { redirect } from "next/navigation";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { canAccessWorkspacePath } from "@/lib/permissions/workspace-access";
import { prisma } from "@/lib/prisma";
import { ActionForm, Field } from "@/features/org-management/forms";
import { field } from "@/features/org-management/ui";
import { dateLabel } from "@/features/org-management/queries";
export const dynamic = "force-dynamic";
export default async function Page() {
  const session = await requireTenantAccess();
  if (!canAccessWorkspacePath(session, "/dashboard/tenant/renewals")) redirect("/access-denied");
  const orgId = session.activeOrgId!;
  const leases = await prisma.lease.findMany({ where: { orgId, tenant: { userId: session.userId, deletedAt: null }, deletedAt: null }, select: { id: true, unit: { select: { houseNo: true } } } });
  const [offers, org] = await Promise.all([prisma.leaseRenewal.findMany({ where: { orgId, leaseId: { in: leases.map(v => v.id) } }, take: 50, orderBy: { createdAt: "desc" } }), prisma.organization.findUniqueOrThrow({ where: { id: orgId }, select: { currencyCode: true } })]);
  return <main className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6"><h1 className="text-2xl font-semibold">Lease renewal offers</h1><p className="text-sm text-muted-foreground">Review the proposed terms and record your response. Acceptance is followed by your manager finalizing the lease; current bills keep their existing amounts. Showing your latest 50 offers.</p>{!offers.length && <p>No renewal offers yet.</p>}{offers.map(v => <article key={v.id} className="space-y-4 rounded-2xl border bg-card p-5"><h2 className="text-lg font-semibold">{leases.find(l => l.id === v.leaseId)?.unit.houseNo} · {v.status}</h2><p>Monthly rent: {new Intl.NumberFormat("en-KE", { style: "currency", currency: org.currencyCode }).format(Number(v.proposedRent))}</p><p>New term end: {dateLabel(v.proposedEndDate)}</p><p className="whitespace-pre-wrap">{v.notice}</p>{v.responseNote && <p>Your response: {v.responseNote}</p>}{v.status === "OFFERED" && <ActionForm operation="respondRenewal" id={v.id} label="Send my response"><Field label="My decision"><select name="decision" className={field}><option value="ACCEPTED">Accept proposed renewal</option><option value="DECLINED">Decline proposed renewal</option></select></Field><Field label="Message to manager (optional)"><textarea name="note" maxLength={2000} className={field} rows={3} /></Field></ActionForm>}</article>)}</main>;
}
