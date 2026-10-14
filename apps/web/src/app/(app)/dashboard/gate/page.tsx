import { SecurityAccountForm } from "@/features/visitors/security-account-form";
import { Building2, CheckCircle2, QrCode, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { gateAccess } from "@/features/visitors/access";
import { GateVerifier, GateAssignmentForm } from "@/features/visitors/forms";

export const metadata = { title: "Gate access", robots: { index: false, follow: false } };

export default async function GatePage() {
  const { orgId, manager, propertyIds } = await gateAccess();
  const now = new Date();
  // Gate activity uses the organization's EAT operating day.
  const today = new Date(now.getTime() + 3 * 3600000).toISOString().slice(0, 10);
  const dayStart = new Date(`${today}T00:00:00+03:00`);
  const scope = { orgId, ...(manager ? {} : { propertyId: { in: propertyIds } }) };
  const [properties, memberships, assignments, issuedToday, admittedToday] = await Promise.all([
    prisma.property.findMany({ where: { orgId, deletedAt: null, ...(manager ? {} : { id: { in: propertyIds } }) }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    manager ? prisma.membership.findMany({ where: { orgId, role: { in: ["ADMIN", "MANAGER", "CARETAKER", "OFFICE", "SECURITY"] }, deactivatedAt: null, employmentEndedAt: null, user: { deletedAt: null } }, select: { role: true, user: { select: { id: true, fullName: true } } } }) : Promise.resolve([]),
    manager ? prisma.gateAssignment.findMany({ where: { orgId }, take: 500, orderBy: { createdAt: "desc" } }) : Promise.resolve([]),
    prisma.visitorPass.count({ where: { ...scope, createdAt: { gte: dayStart, lte: now } } }),
    prisma.visitorPass.count({ where: { ...scope, admittedAt: { gte: dayStart, lte: now } } }),
  ]);
  const staff = [...new Map(memberships.map(m => [m.user.id, { id: m.user.id, name: m.user.fullName }])).values()];
  const securityStaff = [...new Map(memberships.filter(member => member.role === "SECURITY").map(member => [member.user.id, { id: member.user.id, name: member.user.fullName }])).values()];
  const coveredProperties = manager ? new Set(assignments.filter(a => properties.some(p => p.id === a.propertyId)).map(a => a.propertyId)).size : properties.length;
  const metrics = [
    { label: "Assigned properties", value: coveredProperties, icon: Building2, note: manager ? "Properties with gate assignments" : "Your permitted gates" },
    { label: "Passes issued today", value: issuedToday, icon: QrCode, note: "Visitor passes created today" },
    { label: "Admitted today", value: admittedToday, icon: CheckCircle2, note: "Recorded visitor admissions" },
  ];

  return <div data-gate-dashboard className="min-w-0 space-y-5 sm:space-y-6">
    <header className="rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6">
      <div className="flex items-start gap-3 sm:gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShieldCheck aria-hidden="true" className="h-6 w-6" /></span>
        <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wider text-primary">Visitor entry & security</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Gate access</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Check visitor passes, confirm arrival details, and record each admission once.</p></div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium">Single-entry passes</span><span className="rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium">{manager ? "Organization gate management" : "Assigned property access"}</span></div>
    </header>

    <section aria-label="Today's gate activity" className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 lg:grid-cols-3">
      {metrics.map(({ label, value, icon: Icon, note }) => <article key={label} className="rounded-2xl border border-border bg-card p-4 text-card-foreground sm:p-5"><div className="flex items-start justify-between gap-3"><p className="text-sm font-medium text-muted-foreground">{label}</p><Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" /></div><p className="mt-2 text-3xl font-semibold tracking-tight">{value.toLocaleString()}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{note}</p></article>)}
    </section>

    <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <GateVerifier />
      {manager ? <GateAssignmentForm properties={properties} staff={securityStaff} /> : <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6"><div className="flex items-center gap-2"><Building2 aria-hidden="true" className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">Your assigned gates</h2></div><p className="mt-2 text-sm leading-6 text-muted-foreground">You can verify visitors for the properties assigned to your account.</p>{properties.length ? <ul className="mt-4 space-y-3">{properties.map(property => <li key={property.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"><Building2 aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" /><span className="min-w-0 break-words text-sm font-medium">{property.name}</span></li>)}</ul> : <p className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm leading-6 text-muted-foreground">No gates are assigned yet. Ask your organization administrator or manager to assign a property before verifying visitors.</p>}</section>}
    </div>

    {manager && <SecurityAccountForm properties={properties} />}

    {manager && <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Current assignments</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Staff members and the property gates they can access.</p></div><span className="rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold">{assignments.length}</span></div>{assignments.length ? <ul className="mt-4 grid gap-3 md:grid-cols-2">{assignments.map(assignment => <li key={assignment.id} className="flex min-w-0 items-start gap-3 rounded-xl border border-border bg-background p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary"><UserRound aria-hidden="true" className="h-5 w-5" /></span><div className="min-w-0"><p className="break-words text-sm font-semibold">{staff.find(person => person.id === assignment.userId)?.name ?? "Former staff member"}</p><p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground"><Building2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /><span className="break-words">{properties.find(property => property.id === assignment.propertyId)?.name ?? "Unavailable property"}</span></p></div></li>)}</ul> : <div className="mt-4 flex items-start gap-3 rounded-xl border border-dashed border-border p-4"><UsersRound aria-hidden="true" className="h-5 w-5 shrink-0 text-muted-foreground" /><p className="text-sm leading-6 text-muted-foreground">No gate staff assigned yet. Choose a property and staff member above to enable gate access.</p></div>}</section>}
  </div>;
}
