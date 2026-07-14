import Link from "next/link";
import { Prisma } from "@prisma/client";
import {
  Ban,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Filter,
  Inbox,
  Mail,
  MessageSquare,
  Phone,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getPagination } from "@/lib/db/pagination";
import {
  Badge,
  PageHeader,
  PaginationControls,
  StatCard,
  formatDateTime,
  toneForStatus,
} from "../_components/control-plane";
import {
  deletePlatformMessageAction,
  markPlatformMessageReadAction,
  markPlatformMessageSpamAction,
} from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  page?: string;
  pageSize?: string;
  q?: string;
  status?: string;
}>;

const STATUS_OPTIONS = ["OPEN", "READ", "SPAM", "CLOSED"] as const;

function buildWhere({
  q,
  status,
}: {
  q: string;
  status: string;
}): Prisma.PlatformMessageWhereInput {
  const where: Prisma.PlatformMessageWhereInput =
    status ? { status } : { status: { not: "SPAM" } };

  if (status && !STATUS_OPTIONS.includes(status as (typeof STATUS_OPTIONS)[number])) {
    where.status = "OPEN";
  }

  if (q) {
    where.OR = [
      { subject: { contains: q, mode: "insensitive" } },
      { message: { contains: q, mode: "insensitive" } },
      { org: { name: { contains: q, mode: "insensitive" } } },
      { org: { slug: { contains: q, mode: "insensitive" } } },
      { sender: { fullName: { contains: q, mode: "insensitive" } } },
      { sender: { email: { contains: q, mode: "insensitive" } } },
    ];
  }

  return where;
}

function ContactLine({
  email,
  phone,
}: {
  email: string | null | undefined;
  phone?: string | null;
}) {
  return (
    <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-300">
      <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-slate-900">
        <Mail className="h-3.5 w-3.5" />
        <span className="break-all">{email ?? "No email"}</span>
      </span>
      {phone ? (
        <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-slate-900">
          <Phone className="h-3.5 w-3.5" />
          <span>{phone}</span>
        </span>
      ) : null}
    </div>
  );
}

export default async function PlatformMessagesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const status = (params.status ?? "").trim().toUpperCase();
  const { page, pageSize, skip, take } = getPagination({
    page: Number(params.page ?? 1),
    pageSize: Number(params.pageSize ?? 20),
  });
  const where = buildWhere({ q, status });
  const onboardingStatus = status === "OPEN" ? "NEW" : status;
  const openWhere = buildWhere({ q, status: "OPEN" });
  const readWhere = buildWhere({ q, status: "READ" });
  const spamWhere = buildWhere({ q, status: "SPAM" });

  const [
    messages,
    onboardingRequests,
    totalFiltered,
    openCount,
    readCount,
    spamCount,
    newOnboardingCount,
  ] = await Promise.all([
    prisma.platformMessage.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip,
      take,
      include: {
        org: { select: { name: true, slug: true, status: true } },
        sender: { select: { fullName: true, email: true, phone: true } },
      },
    }),
    prisma.onboardingRequest.findMany({
      where: {
        ...(onboardingStatus ? { status: onboardingStatus } : {}),
        ...(q
          ? {
              OR: [
                { fullName: { contains: q, mode: "insensitive" } },
                { companyName: { contains: q, mode: "insensitive" } },
                { workEmail: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
                { managedPropertyType: { contains: q, mode: "insensitive" } },
                { message: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.platformMessage.count({ where }),
    prisma.platformMessage.count({ where: openWhere }),
    prisma.platformMessage.count({ where: readWhere }),
    prisma.platformMessage.count({ where: spamWhere }),
    prisma.onboardingRequest.count({ where: { status: "NEW" } }),
  ]);

  const sortedMessages = [...messages].sort((a, b) => {
    const priority = (value: string) => (value === "OPEN" ? 0 : value === "READ" ? 1 : value === "CLOSED" ? 2 : 3);
    const priorityDelta = priority(a.status) - priority(b.status);
    if (priorityDelta !== 0) return priorityDelta;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Support inbox"
        title="Organization messages"
        description="Requests and support messages from organization dashboards, paginated for high-volume operations."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Matching" value={totalFiltered} />
        <StatCard label="Open" value={openCount} />
        <StatCard label="Read" value={readCount} />
        <StatCard label="Spam" value={spamCount} />
        <StatCard label="New onboarding" value={newOnboardingCount} />
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200">
              <Inbox className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                New onboarding requests
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">
                Public access requests submitted from the registration page.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={toneForStatus(newOnboardingCount > 0 ? "pending" : "closed")}>
              {newOnboardingCount} new
            </Badge>
            <Link
              href="/platform/onboarding"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Manage
            </Link>
          </div>
        </div>

        {onboardingRequests.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-300">
            No onboarding requests found.
          </div>
        ) : (
          <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-2">
            {onboardingRequests.map((request) => (
              <article
                key={request.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-slate-950 dark:text-white">
                      {request.companyName}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-300">
                      <UserRound className="h-4 w-4 shrink-0" />
                      <span className="break-words">{request.fullName}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Badge tone={toneForStatus(request.status === "NEW" ? "pending" : request.status)}>
                      {request.status}
                    </Badge>
                    <Badge>
                      <Clock3 className="mr-1 h-3.5 w-3.5" />
                      {formatDateTime(request.createdAt)}
                    </Badge>
                  </div>
                </div>

                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
                  <Building2 className="h-3.5 w-3.5" />
                  {request.managedPropertyType}
                </div>

                {request.message ? (
                  <p className="mt-4 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200">
                    {request.message}
                  </p>
                ) : null}

                <div className="mt-4">
                  <ContactLine email={request.workEmail} phone={request.phone} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
        <div className="border-b border-slate-100 p-4 dark:border-white/10 sm:p-5">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200">
              <MessageSquare className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                Organization support messages
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">
                Search, filter, and review messages sent from organization workspaces.
              </p>
            </div>
          </div>

          <form className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Search subject, message, org, or sender"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white dark:border-white/10 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white/25"
              />
            </label>
            <label className="relative block">
              <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                name="status"
                defaultValue={status}
                className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-11 text-sm font-medium text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:border-white/25"
              >
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <button className="h-12 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800">
              Apply
            </button>
          </form>
        </div>

        {messages.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-300">No messages found.</div>
        ) : (
          <div className="grid gap-3 p-4 sm:p-5 xl:grid-cols-2">
            {sortedMessages.map((message) => (
              <article
                key={message.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                      {message.subject}
                    </h2>
                    <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-slate-500 dark:text-slate-300">
                      <Building2 className="h-4 w-4 shrink-0" />
                      <span>{message.org.name}</span>
                      <span className="text-slate-300 dark:text-slate-600">/</span>
                      <span>{message.org.slug}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Badge tone={toneForStatus(message.status)}>{message.status}</Badge>
                    <Badge>
                      <Clock3 className="mr-1 h-3.5 w-3.5" />
                      {formatDateTime(message.createdAt)}
                    </Badge>
                  </div>
                </div>

                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
                  <UserRound className="h-3.5 w-3.5" />
                  {message.sender.fullName}
                </div>

                <p className="mt-4 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200">
                  {message.message}
                </p>

                <div className="mt-4">
                  <ContactLine email={message.sender.email} phone={message.sender.phone} />
                </div>

                <div className="platform-action-group mt-4 border-t border-slate-200 pt-4 dark:border-white/10">
                  {message.status === "OPEN" ? (
                    <form action={markPlatformMessageReadAction}>
                      <input type="hidden" name="messageId" value={message.id} />
                      <button className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Mark read
                      </button>
                    </form>
                  ) : null}
                  {message.status !== "SPAM" ? (
                    <form action={markPlatformMessageSpamAction}>
                      <input type="hidden" name="messageId" value={message.id} />
                      <button className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-800 shadow-sm transition hover:bg-amber-100 dark:border-amber-300/30 dark:bg-amber-300/10 dark:text-amber-100 dark:hover:bg-amber-300/20">
                        <Ban className="h-3.5 w-3.5" />
                        Spam
                      </button>
                    </form>
                  ) : null}
                  <form
                    action={deletePlatformMessageAction}
                    className="platform-action-danger"
                  >
                    <input type="hidden" name="messageId" value={message.id} />
                    <button className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-100 dark:border-red-300/30 dark:bg-red-300/10 dark:text-red-100 dark:hover:bg-red-300/20">
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}

        <PaginationControls
          page={page}
          pageSize={pageSize}
          total={totalFiltered}
          basePath="/platform/messages"
          query={{ q, status }}
        />
      </section>
    </div>
  );
}
