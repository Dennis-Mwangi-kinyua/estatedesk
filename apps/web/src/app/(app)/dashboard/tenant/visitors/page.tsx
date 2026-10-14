import { prisma } from "@/lib/prisma";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { VisitorForm, RevokePass } from "@/features/visitors/forms";
import { visitorPassState } from "@/features/visitors/policy";
export default async function VisitorsPage() {
  const session = await requireTenantAccess();
  const passes = await prisma.visitorPass.findMany({ where: { orgId: session.activeOrgId!, tenantUserId: session.userId }, orderBy: { createdAt: "desc" }, take: 30 });
  return <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6"><header><h1 className="text-3xl font-semibold">Visitors</h1><p className="mt-2 text-muted-foreground">Invite a guest and share a time limited QR pass with your property’s gate.</p></header><VisitorForm /><section className="space-y-3"><h2 className="text-xl font-semibold">Recent passes</h2>{passes.length === 0 && <p className="text-muted-foreground">No visitor passes yet.</p>}{passes.map(pass => <article key={pass.id} className="rounded-xl border bg-card p-4"><p className="font-semibold">{pass.visitorName}</p><p className="text-sm text-muted-foreground">{visitorPassState(pass).toLowerCase()} · Valid until {pass.validUntil.toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })} EAT</p>{!pass.admittedAt && !pass.revokedAt && pass.validUntil > new Date() && <RevokePass id={pass.id} />}</article>)}</section></main>;
}
