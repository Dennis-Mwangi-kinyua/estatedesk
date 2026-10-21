
import Link from "@/components/navigation/workspace-link";
import { Prisma } from "@prisma/client";
import { ArrowRight, ArrowUpRight, Inbox, Mail, Search, UserRoundPlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getPagination } from "@/lib/db/pagination";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { PaginationControls } from "../_components/control-plane";
import { MessagesInbox } from "./_components/messages-inbox";

export const dynamic = "force-dynamic";
type SearchParams = Promise<{ page?: string; pageSize?: string; q?: string; status?: string }>;
const queues = [
  { status: "OPEN", label: "Unread", detail: "Needs a response" },
  { status: "READ", label: "Read", detail: "Reviewed" },
  { status: "CLOSED", label: "Closed", detail: "Follow-up complete" },
  { status: "SPAM", label: "Spam", detail: "Set aside" },
];
function buildWhere(q: string, status: string): Prisma.PlatformMessageWhereInput {
  return {
    ...(status ? { status } : { status: { not: "SPAM" } }),
    ...(q ? { OR: [
      { subject: { contains: q, mode: "insensitive" as const } },
      { message: { contains: q, mode: "insensitive" as const } },
      { org: { name: { contains: q, mode: "insensitive" as const } } },
      { org: { slug: { contains: q, mode: "insensitive" as const } } },
      { sender: { fullName: { contains: q, mode: "insensitive" as const } } },
      { sender: { email: { contains: q, mode: "insensitive" as const } } },
    ] } : {}),
  };
}

export default async function PlatformMessagesPage({ searchParams }: { searchParams: SearchParams }) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], { redirectTo: "/dashboard" });
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 200);
  const status = queues.find(queue => queue.status === (params.status ?? "").toUpperCase())?.status ?? "";
  const { page, pageSize, skip, take } = getPagination({
    page: /^\d{1,6}$/.test(params.page ?? "") ? Number(params.page) : 1,
    pageSize: /^\d{1,3}$/.test(params.pageSize ?? "") ? Number(params.pageSize) : 20,
  });
  const where = buildWhere(q, status);
  const searchWhere = buildWhere(q, "");
  delete searchWhere.status;
  const query = <T,>(label: string, operation: () => Promise<T>) => retryTransientDatabaseOperation(operation, { label, attempts: 2 });
  const [messages, totalFiltered, statusCounts, newOnboardingCount, onboardingRequests] = await Promise.all([
    query("platform-messages-list", () => prisma.platformMessage.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, include: { org: { select: { name: true, slug: true } }, sender: { select: { fullName: true, email: true, phone: true } } } })),
    query("platform-messages-total", () => prisma.platformMessage.count({ where })),
    query("platform-messages-queues", () => prisma.platformMessage.groupBy({ by: ["status"], where: searchWhere, _count: { _all: true } })),
    query("platform-messages-onboarding-count", () => prisma.onboardingRequest.count({ where: { status: "NEW" } })),
    query("platform-messages-onboarding-preview", () => prisma.onboardingRequest.findMany({ where: { status: "NEW" }, orderBy: { createdAt: "asc" }, take: 3, select: { id: true, companyName: true, fullName: true } })),
  ]);
  const count = (value: string) => statusCounts.find(group => group.status === value)?._count._all ?? 0;
  const queueHref = (value: string, search = q) => `/platform/messages?${new URLSearchParams({ ...(value ? { status: value } : {}), ...(search ? { q: search } : {}), pageSize: String(pageSize) })}`;
  const viewLabel = queues.find(queue => queue.status === status)?.label ?? "All messages";

  return <div className="mx-auto w-full min-w-0 max-w-7xl space-y-5 sm:space-y-6">
    <header className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"><Mail aria-hidden="true" className="h-4 w-4 text-primary" />Platform operations</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Your support inbox</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Review organisation messages, contact the sender, and keep follow-ups organised.</p>
      </div>
      <Link href={queueHref("OPEN")} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
        <Inbox aria-hidden="true" className="h-4 w-4" />Review unread<span className="rounded-md bg-primary-foreground/15 px-1.5 py-0.5 text-xs">{count("OPEN")}</span><ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </header>

    <nav aria-label="Message queues" className="grid grid-cols-2 gap-3 xl:grid-cols-4">{queues.map(queue => <Link key={queue.status} href={queueHref(queue.status)} aria-current={status === queue.status ? "page" : undefined} className={`group flex min-w-0 items-center justify-between gap-3 rounded-xl border p-4 transition hover:border-primary/40 hover:shadow-sm ${status === queue.status ? "border-primary/40 bg-primary/5 shadow-sm" : "border-border bg-card"}`}><div className="min-w-0"><p className="text-sm font-semibold text-foreground">{queue.label}</p><p className="mt-1 text-xs text-muted-foreground">{queue.detail}</p></div><span className={`text-2xl font-semibold tabular-nums ${status === queue.status ? "text-primary" : "text-foreground"}`}>{count(queue.status)}</span></Link>)}</nav>

    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3"><h2 className="text-sm font-semibold text-foreground">{viewLabel}</h2><span className="rounded-md bg-muted px-2 py-1 text-xs font-medium tabular-nums text-muted-foreground">{totalFiltered}</span>{status && <Link href={queueHref("")} className="text-xs font-medium text-primary hover:underline">All messages</Link>}</div>
      <form className="flex min-w-0 gap-2 sm:w-full sm:max-w-lg"><input type="hidden" name="status" value={status} /><input type="hidden" name="pageSize" value={pageSize} /><label className="relative min-w-0 flex-1"><span className="sr-only">Search messages</span><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><input type="search" name="q" defaultValue={q} maxLength={200} placeholder="Search messages, organisations, or people…" className="min-h-11 w-full rounded-lg border border-input bg-background py-2 pl-10 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15" /></label><button data-workspace-action="true" className="min-h-11 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:bg-muted">Search</button>{q && <Link href={queueHref(status, "")} className="inline-flex min-h-11 items-center px-1 text-xs font-medium text-muted-foreground underline">Clear</Link>}</form>
    </div>

    <MessagesInbox key={`${q}:${status}:${page}`} filtered={Boolean(q || status)} messages={messages.map(message => ({ id: message.id, subject: message.subject, message: message.message, status: message.status, org: message.org, sender: message.sender, createdAt: message.createdAt.toISOString() }))} />
    <PaginationControls page={page} pageSize={pageSize} total={totalFiltered} basePath="/platform/messages" query={{ q, status }} />

    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between" aria-label="New organisation requests"><div className="flex items-start gap-3"><span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"><UserRoundPlus className="h-5 w-5" /></span><div><h2 className="text-sm font-semibold text-foreground">New organisation requests <span className="ml-1 rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">{newOnboardingCount}</span></h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{onboardingRequests.length ? onboardingRequests.map(request => request.companyName).join(" · ") : "No applicants are waiting for a first response."}</p></div></div><Link data-workspace-action="true" href="/platform/onboarding?status=NEW" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:bg-muted">Review applicants<ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link></section>
  </div>;
}
