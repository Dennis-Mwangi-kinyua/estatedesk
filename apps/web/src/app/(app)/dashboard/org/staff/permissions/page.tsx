import Link from "@/components/navigation/workspace-link";
import { requireOrgRole } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { DELEGATABLE_ORG_ROLES } from "@/lib/permissions/role-matrix";
import { decodePublicId, encodePublicId } from "@/lib/public-id";
import { StaffMandatesForm } from "@/features/staff/components/staff-mandates-form";
export const dynamic = "force-dynamic";
export default async function StaffPermissionsPage({ searchParams }: { searchParams: Promise<{ member?: string }> }) {
  const session = await requireOrgRole(["ADMIN"]);
  const params = await searchParams;
  const members = await prisma.membership.findMany({ where: { orgId: session.activeOrgId!, role: { in: [...DELEGATABLE_ORG_ROLES] }, employmentEndedAt: null, deactivatedAt: null, user: { deletedAt: null, status: "ACTIVE" } }, include: { user: { select: { fullName: true } }, staffProfile: { select: { jobTitle: true } } }, orderBy: { user: { fullName: "asc" } } });
  const selectedId = params.member ? decodePublicId(params.member, "membership") : members[0]?.id;
  const selected = members.find(member => member.id === selectedId);
  return <div className="mx-auto w-full space-y-6 px-4 py-6 pb-28 sm:px-6 lg:px-8"><Link href="/dashboard/org/staff" className="inline-flex min-h-11 items-center text-sm text-primary">← Back to staff</Link><header className="space-y-3 rounded-3xl border border-border bg-card p-5 sm:p-8"><h1 className="text-2xl font-semibold">Staff permissions and approval mandates</h1><p className="max-w-3xl text-sm leading-6 text-muted-foreground">Give a secretary, office worker, manager, or accountant specific extra powers while keeping their existing role. Each change records who authorised it and why.</p></header>
    <form method="get" className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-end"><label className="grid flex-1 gap-2 text-sm font-medium">Staff member<select name="member" defaultValue={selected ? encodePublicId(selected.id, "membership") : ""} className="min-h-11 w-full rounded-xl border border-border bg-background p-3">{members.map(member => <option key={member.id} value={encodePublicId(member.id, "membership")}>{member.user.fullName} — {member.staffProfile?.jobTitle || member.role.toLowerCase()}</option>)}</select></label><button className="min-h-11 rounded-xl border border-border px-5 py-3 text-sm font-semibold">Open permissions</button></form>
    {selected ? <section className="space-y-5 rounded-3xl border border-border bg-card p-5 sm:p-8"><div><h2 className="text-xl font-semibold">{selected.user.fullName}</h2><p className="mt-1 text-sm text-muted-foreground">{selected.staffProfile?.jobTitle || selected.role.toLowerCase()}</p></div><StaffMandatesForm key={selected.id} membershipId={selected.id} role={selected.role} grants={selected.grantedPermissions} /></section> : <p className="rounded-2xl border border-border bg-card p-5 text-sm">No eligible active staff member selected.</p>}
  </div>;
}
