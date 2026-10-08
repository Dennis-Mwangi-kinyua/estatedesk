import { Prisma } from "@prisma/client";
import Link from "next/link";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { OnboardingRequestCard } from "./_components/onboarding-request-card";
import { ArrowRight, Plus, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getPagination } from "@/lib/db/pagination";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { PageHeader, PaginationControls } from "../_components/control-plane";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  page?: string;
  pageSize?: string;
  q?: string;
  status?: string;
}>;

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "CLOSED", "REJECTED"] as const;

function onboardingQuery<T>(label: string, operation: () => Promise<T>) {
  return retryTransientDatabaseOperation(operation, {
    attempts: 4,
    delayMs: 650,
    label,
  });
}

function buildWhere({
  q,
  status,
}: {
  q: string;
  status: string;
}): Prisma.OnboardingRequestWhereInput {
  const where: Prisma.OnboardingRequestWhereInput = {};

  if (status) where.status = status;

  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
      { workEmail: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { managedPropertyType: { contains: q, mode: "insensitive" } },
      { referralCode: { contains: q, mode: "insensitive" } },
      { message: { contains: q, mode: "insensitive" } },
      { internalNotes: { contains: q, mode: "insensitive" } },
      { marketer: { fullName: { contains: q, mode: "insensitive" } } },
    ];
  }

  return where;
}

export default async function PlatformOnboardingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], { redirectTo: "/dashboard" });
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 200);
  const rawStatus = (params.status ?? "").trim().toUpperCase();
  const status = STATUSES.find(item => item === rawStatus) ?? "";
  const { page, pageSize, skip, take } = getPagination({
    page: /^\d{1,6}$/.test(params.page ?? "") ? Number(params.page) : 1,
    pageSize: /^\d{1,3}$/.test(params.pageSize ?? "") ? Number(params.pageSize) : 20,
  });
  const where = buildWhere({ q, status });

  const [requests, totalFiltered, newCount, contactedCount, qualifiedCount, closedCount] =
    await Promise.all([
      onboardingQuery("platform-onboarding-requests", () =>
        prisma.onboardingRequest.findMany({
          where,
          orderBy: { createdAt: status === "NEW" ? "asc" : "desc" },
          skip,
          take,
          include: {
            handledBy: { select: { fullName: true, email: true } },
            marketer: { select: { fullName: true, referralCode: true } },
          },
        }),
      ),
      onboardingQuery("platform-onboarding-total-filtered", () =>
        prisma.onboardingRequest.count({ where }),
      ),
      onboardingQuery("platform-onboarding-new-count", () =>
        prisma.onboardingRequest.count({ where: { status: "NEW" } }),
      ),
      onboardingQuery("platform-onboarding-contacted-count", () =>
        prisma.onboardingRequest.count({ where: { status: "CONTACTED" } }),
      ),
      onboardingQuery("platform-onboarding-qualified-count", () =>
        prisma.onboardingRequest.count({ where: { status: "QUALIFIED" } }),
      ),
      onboardingQuery("platform-onboarding-closed-count", () =>
        prisma.onboardingRequest.count({ where: { status: "CLOSED" } }),
      ),
    ]);

  const queues = [
    { status: "NEW", label: "Needs contact", count: newCount },
    { status: "CONTACTED", label: "Needs qualification", count: contactedCount },
    { status: "QUALIFIED", label: "Ready for setup", count: qualifiedCount },
  ];
  return <div className="space-y-5">
    <PageHeader eyebrow="Organisation setup" title="Onboarding requests" description="Contact applicants, qualify their requirements, and create their organisations." action={<Link data-workspace-action="true" href="/platform/organizations/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />Create organisation</Link>} />
    <nav aria-label="Onboarding work queues" className="grid gap-3 sm:grid-cols-3">{queues.map(queue => <Link key={queue.status} href={`/platform/onboarding?status=${queue.status}`} aria-current={status === queue.status ? "page" : undefined} className={`flex min-h-24 items-center justify-between gap-3 rounded-xl border p-4 transition hover:border-primary/40 ${status === queue.status ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}><div><span className="block text-sm font-semibold">{queue.label}</span><span className="mt-1 block text-2xl font-semibold">{queue.count}</span></div><ArrowRight className="h-4 w-4 text-muted-foreground" /></Link>)}</nav>
    <section className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5" aria-label="Filter requests">
      <form className="grid items-end gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
        <label className="min-w-0 text-sm font-medium">Search requests<div className="relative mt-2"><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><input name="q" defaultValue={q} maxLength={200} placeholder="Company, contact, email, phone, or notes" className="min-h-11 w-full rounded-xl border border-border bg-card py-2 pl-10 pr-3 font-normal" /></div></label>
        <label className="text-sm font-medium">Status<select name="status" defaultValue={status} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-card px-3 font-normal"><option value="">All statuses</option>{STATUSES.map(item => <option key={item} value={item}>{item[0] + item.slice(1).toLowerCase()}</option>)}</select></label>
        <div className="flex items-center gap-3"><button data-workspace-action="true" className="min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Apply filters</button>{(q || status) && <Link className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline" href="/platform/onboarding">Clear filters</Link>}</div>
        <input type="hidden" name="pageSize" value={pageSize} />
      </form>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm text-muted-foreground"><p>{totalFiltered} {totalFiltered === 1 ? "request" : "requests"}{status ? ` · ${status[0] + status.slice(1).toLowerCase()}` : " · All statuses"}{q ? ` matching “${q}”` : ""}</p><Link className="underline" href="/platform/onboarding?status=CLOSED">View closed requests ({closedCount})</Link></div>
    </section>
    {requests.length === 0 ? <section className="rounded-2xl border border-dashed border-border bg-card p-8 text-center"><h2 className="font-semibold">{q ? "No matching requests" : status === "NEW" ? "No new requests waiting" : "No requests in this view"}</h2><p className="mt-2 text-sm text-muted-foreground">{q ? "Try a different search or clear the filters." : "Switch queues to follow up on existing applicants."}</p><Link className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-medium" href="/platform/onboarding">View all requests</Link></section> : <section className="space-y-4" aria-label="Onboarding requests">{requests.map(request => <OnboardingRequestCard key={request.id} request={{ id: request.id, companyName: request.companyName, fullName: request.fullName, workEmail: request.workEmail, phone: request.phone, managedPropertyType: request.managedPropertyType, status: request.status, message: request.message, internalNotes: request.internalNotes, createdAt: request.createdAt.toISOString(), handledAt: request.handledAt?.toISOString() ?? null, handledBy: request.handledBy?.fullName ?? request.handledBy?.email ?? null, commissionRate: request.commissionRate?.toString() ?? null, referral: request.marketer ? `${request.marketer.fullName} (${request.marketer.referralCode})` : request.referralCode }} />)}</section>}
    <PaginationControls page={page} pageSize={pageSize} total={totalFiltered} basePath="/platform/onboarding" query={{ q, status }} />
  </div>;
}
