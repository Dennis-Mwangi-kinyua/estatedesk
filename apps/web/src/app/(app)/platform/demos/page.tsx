import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { CrmShell, Panel, Field, inputClass, dateText } from "@/features/crm/ui";
import { pageNumber } from "@/features/crm/queries";
import { label } from "@/features/crm/policy";
import { DEMO_SOURCE } from "@/lib/sales/demo-policy";

export const dynamic = "force-dynamic";
export const metadata = { title: "Demo requests | EstateDesk" };
const filters = ["all", "new", "unassigned", "scheduled", "trialing", "closed"] as const;
export default async function DemoRequestsPage({ searchParams }: { searchParams: Promise<{ q?: string; view?: string; page?: string }> }) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]);
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 160);
  const view = filters.find(item => item === params.view) ?? "all";
  const page = pageNumber(params.page);
  const open = { salesStage: { notIn: ["WON", "LOST"] as ("WON" | "LOST")[] } };
  const views: Record<typeof filters[number], Prisma.OnboardingRequestWhereInput> = {
    all: {}, new: { salesStage: "NEW" }, unassigned: { ...open, salesOwnerId: null },
    scheduled: { salesStage: "DEMO_SCHEDULED" },
    trialing: { customerOrg: { subscription: { status: "TRIALING", trialEndsAt: { gt: new Date() } } } },
    closed: { salesStage: { in: ["WON", "LOST"] } },
  };
  const where: Prisma.OnboardingRequestWhereInput = {
    source: DEMO_SOURCE, ...views[view],
    ...(q ? { OR: ["companyName", "fullName", "workEmail"].map(key => ({ [key]: { contains: q, mode: "insensitive" } })) } : {}),
  };
  const [requests, total, stats] = await Promise.all([
    prisma.onboardingRequest.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 20, take: 20,
      include: { salesOwner: { select: { fullName: true } }, customerOrg: { select: { subscription: { select: { status: true, trialEndsAt: true } } } } } }),
    prisma.onboardingRequest.count({ where }),
    Promise.all(["all", "new", "unassigned", "scheduled", "trialing"].map(key => prisma.onboardingRequest.count({ where: { source: DEMO_SOURCE, ...views[key as typeof view] } }))),
  ]);
  const href = (next: number) => `/platform/demos?${new URLSearchParams({ q, view, page: String(next) })}`;
  return <CrmShell platform title="Demo requests" description="Everyone who asked to see EstateDesk, with their contact details, demo appointment and next step.">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {[["All requests", "all"], ["New requests", "new"], ["Needs an owner", "unassigned"], ["Demo scheduled", "scheduled"], ["On trial", "trialing"]].map(([title, key], index) => <Link key={key} href={`/platform/demos?view=${key}`} aria-current={view === key ? "page" : undefined} className={`min-w-0 rounded-2xl border p-4 ${view === key ? "border-primary bg-primary/10" : "border-border bg-card"}`}><p className="text-xs text-muted-foreground">{title}</p><p className="mt-2 text-3xl font-semibold">{stats[index]}</p></Link>)}
    </div>
    <Panel>
      <h2 className="font-semibold">A clear next step for every request</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Assign an owner, contact the client and agree a 30–45 minute demo. Open a 14-day Pro or Plus trial when they are ready. Requesting a demo does not start the trial.</p>
      <form className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <Field title="Search requests"><input name="q" defaultValue={q} placeholder="Company, name or email" className={inputClass} /></Field>
        <Field title="Show"><select name="view" defaultValue={view} className={inputClass}>{filters.map(item => <option key={item} value={item}>{label(item)}</option>)}</select></Field>
        <button className="min-h-12 self-end rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Filter requests</button>
      </form>
    </Panel>
    <section aria-label="Demo request list" className="space-y-4">
      <p className="text-sm text-muted-foreground">{total} matching requests · newest first</p>
      <div className="grid gap-4 lg:grid-cols-2">
        {requests.map(request => <article key={request.id} className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-2"><h2 className="text-xl font-semibold">{request.companyName}</h2><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{label(request.salesStage)}</span></div>
          <p className="mt-2 text-sm">{request.fullName} · {request.managedPropertyType}</p>
          <p className="mt-1 break-all text-sm text-muted-foreground">{request.workEmail}{request.phone ? ` · ${request.phone}` : ""}</p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-xs text-muted-foreground">Sales owner</dt><dd className="mt-1 font-medium">{request.salesOwner?.fullName ?? "Needs an owner"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Requested</dt><dd className="mt-1">{dateText(request.createdAt)} EAT</dd></div>
            <div><dt className="text-xs text-muted-foreground">Demo appointment</dt><dd className="mt-1">{request.demoAt ? `${dateText(request.demoAt)} EAT` : "Contact client to agree a time"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Plan / trial</dt><dd className="mt-1">{request.targetPlan ?? "Discuss with client"}{request.customerOrg?.subscription?.trialEndsAt ? ` · Trial ends ${dateText(request.customerOrg.subscription.trialEndsAt)} EAT` : ""}</dd></div>
          </dl>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link href={`/platform/crm/${request.id}`} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Manage demo & follow-up</Link>
            <a href={`mailto:${request.workEmail}`} className="inline-flex min-h-12 items-center justify-center rounded-xl border px-4 text-sm font-medium" aria-label={`Email ${request.fullName}`}>Email client</a>
            {request.phone && <a href={`tel:${request.phone}`} className="inline-flex min-h-12 items-center justify-center rounded-xl border px-4 text-sm font-medium" aria-label={`Call ${request.fullName}`}>Call client</a>}
          </div>
        </article>)}
      </div>
      {!requests.length && <Panel><h2 className="font-semibold">{q || view !== "all" ? "No requests match these filters" : "Your next demo starts here"}</h2><p className="mt-2 text-sm text-muted-foreground">{q || view !== "all" ? "Try a different search or show all requests." : "Requests from the public demo form will appear here automatically."}</p><Link href={q || view !== "all" ? "/platform/demos" : "/register?intent=demo"} className="mt-3 inline-flex min-h-11 items-center font-semibold underline">{q || view !== "all" ? "Show all demo requests" : "Open public demo form"}</Link></Panel>}
      <nav aria-label="Demo request pages" className="flex flex-wrap items-center gap-4 text-sm">
        {page > 1 && <Link className="inline-flex min-h-11 items-center underline" href={href(page - 1)}>Previous</Link>}
        <span>Page {page} · 20 per page</span>
        {page * 20 < total && <Link className="inline-flex min-h-11 items-center underline" href={href(page + 1)}>Next</Link>}
      </nav>
    </section>
  </CrmShell>;
}
