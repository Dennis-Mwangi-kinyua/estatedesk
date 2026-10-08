import Link from "next/link";
import { Prisma } from "@prisma/client";
import { ArrowRight, ArrowUpRight, Search, Mail } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getPagination } from "@/lib/db/pagination";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { PaginationControls } from "../_components/control-plane";
import { MessagesInbox } from "./_components/messages-inbox";

export const dynamic = "force-dynamic";
type SearchParams = Promise<{ page?: string; pageSize?: string; q?: string; status?: string }>;
const queues = [
  { status: "OPEN", label: "Unread", emoji: "✉️", detail: "Ready for your attention", tone: "bg-sky-500/10 text-sky-700 dark:text-sky-200" },
  { status: "READ", label: "Read", emoji: "📖", detail: "Reviewed conversations", tone: "bg-violet-500/10 text-violet-700 dark:text-violet-200" },
  { status: "CLOSED", label: "Closed", emoji: "✅", detail: "Completed follow-ups", tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200" },
  { status: "SPAM", label: "Spam", emoji: "🛡️", detail: "Set aside from your inbox", tone: "bg-amber-500/10 text-amber-800 dark:text-amber-200" },
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
    <header className="relative isolate overflow-hidden rounded-[1.75rem] border border-sky-200/70 bg-linear-to-br from-sky-50 via-white to-violet-50 p-5 shadow-sm dark:border-sky-400/15 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/50 sm:p-7">
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-violet-400/10 blur-3xl" />
      <div className="relative flex items-center justify-between gap-5"><div className="min-w-0"><p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-800 dark:text-sky-200"><Mail aria-hidden="true" className="h-3.5 w-3.5" />Platform communications</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Your support inbox</h1><p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">Keep every conversation moving. Read requests, reach the right person, and follow up with confidence.</p><Link href={queueHref("OPEN")} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-sky-400 dark:text-slate-950 dark:hover:bg-sky-300">Review unread<span className="rounded-md bg-white/15 px-1.5 py-0.5 text-xs dark:bg-slate-950/10">{count("OPEN")}</span><ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></div>
        <div aria-hidden="true" className="relative hidden h-36 w-40 shrink-0 sm:block"><div className="absolute left-0 top-5 grid h-24 w-24 -rotate-12 place-items-center rounded-[1.6rem] border-4 border-white bg-sky-100 text-5xl shadow-lg shadow-sky-900/10 dark:border-slate-800 dark:bg-sky-950">💌</div><div className="absolute bottom-0 right-0 grid h-20 w-20 rotate-12 place-items-center rounded-3xl border-4 border-white bg-violet-100 text-4xl shadow-lg shadow-violet-900/10 dark:border-slate-800 dark:bg-violet-950">💬</div></div>
      </div>
    </header>

    <nav aria-label="Message queues" className="grid grid-cols-2 gap-3 xl:grid-cols-4">{queues.map(queue => <Link key={queue.status} href={queueHref(queue.status)} aria-current={status === queue.status ? "page" : undefined} className={`group flex min-w-0 items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm transition motion-safe:hover:-translate-y-0.5 hover:shadow-md sm:p-4 ${status === queue.status ? "border-sky-500/50 ring-1 ring-sky-500/10" : "border-border"}`}><span aria-hidden="true" className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-2xl ${queue.tone}`}>{queue.emoji}</span><div className="min-w-0"><div className="flex flex-wrap items-baseline gap-x-2"><span className="text-xl font-semibold">{count(queue.status)}</span><span className="text-xs font-medium text-muted-foreground">{queue.label}</span></div><p className="mt-1 hidden text-[11px] leading-4 text-muted-foreground sm:block">{queue.detail}</p></div></Link>)}</nav>

    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex shrink-0 items-center gap-3"><h2 className="text-sm font-semibold">{viewLabel}</h2><span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{totalFiltered}</span>{status && <Link href={queueHref("")} className="text-xs text-primary underline underline-offset-4">All mail</Link>}</div>
      <form className="flex min-w-0 gap-2 lg:w-full lg:max-w-lg"><input type="hidden" name="status" value={status} /><input type="hidden" name="pageSize" value={pageSize} /><label className="relative min-w-0 flex-1"><span className="sr-only">Search messages</span><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><input type="search" name="q" defaultValue={q} maxLength={200} placeholder="Search messages, organisations, or people…" className="min-h-11 w-full rounded-xl border border-border bg-muted/30 py-2 pl-10 pr-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/10" /></label><button className="min-h-11 rounded-xl border border-border px-3 text-sm font-semibold transition hover:bg-muted">Search</button>{q && <Link href={queueHref(status, "")} className="inline-flex min-h-11 items-center px-1 text-xs text-muted-foreground underline">Clear</Link>}</form>
    </div>

    <MessagesInbox key={`${q}:${status}:${page}`} filtered={Boolean(q || status)} messages={messages.map(message => ({ id: message.id, subject: message.subject, message: message.message, status: message.status, org: message.org, sender: message.sender, createdAt: message.createdAt.toISOString() }))} />
    <PaginationControls page={page} pageSize={pageSize} total={totalFiltered} basePath="/platform/messages" query={{ q, status }} />

    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card/70 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between" aria-label="New organisation requests"><div className="flex items-start gap-3"><span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-2xl">🌱</span><div><h2 className="text-sm font-semibold">New organisation requests <span className="ml-1 text-muted-foreground">· {newOnboardingCount}</span></h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{onboardingRequests.length ? onboardingRequests.map(request => request.companyName).join(" · ") : "No applicants are waiting for a first response."}</p></div></div><Link href="/platform/onboarding?status=NEW" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold transition hover:bg-muted">Review applicants<ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link></section>
  </div>;
}
