import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { gateAccess } from "@/features/visitors/access";
import { GateVerifier, GateAssignmentForm } from "@/features/visitors/forms";
export const metadata = { title: "Gate access", robots: { index: false, follow: false } };
export default async function GatePage() {
  const { session, orgId, manager } = await gateAccess();
  const [properties, memberships, assignments] = manager ? await Promise.all([
    prisma.property.findMany({ where: { orgId, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.membership.findMany({ where: { orgId, role: { in: ["ADMIN", "MANAGER", "CARETAKER", "OFFICE"] }, deactivatedAt: null, employmentEndedAt: null, user: { deletedAt: null } }, select: { user: { select: { id: true, fullName: true } } } }),
    prisma.gateAssignment.findMany({ where: { orgId }, take: 500 }),
  ]) : [[], [], []];
  const staff = [...new Map(memberships.map(m => [m.user.id, { id: m.user.id, name: m.user.fullName }])).values()];
  return <main className="ed-theme-page min-h-dvh"><div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6"><Link href={session.activeOrgRole === "CARETAKER" ? "/dashboard/caretaker" : "/dashboard/org"} className="inline-flex min-h-11 items-center underline">← Back to workspace</Link><header><h1 className="text-3xl font-semibold">Gate access</h1><p className="mt-2 text-muted-foreground">Verify expected visitors and record each admission once.</p></header><GateVerifier />{manager && <><GateAssignmentForm properties={properties} staff={staff} /><section className="rounded-2xl border bg-card p-5"><h2 className="text-xl font-semibold">Current assignments</h2><ul className="mt-3 space-y-2 text-sm">{assignments.map(a => <li key={a.id}>{staff.find(s => s.id === a.userId)?.name ?? "Former staff member"} · {properties.find(p => p.id === a.propertyId)?.name ?? "Unavailable property"}</li>)}</ul></section></>}</div></main>;
}
