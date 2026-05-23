import Link from "next/link";
import { Prisma } from "@prisma/client";
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

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  page?: string;
  pageSize?: string;
  q?: string;
  status?: string;
}>;

function buildWhere({
  q,
  status,
}: {
  q: string;
  status: string;
}): Prisma.PlatformMessageWhereInput {
  const where: Prisma.PlatformMessageWhereInput = {};

  if (status) where.status = status;

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

  const [
    messages,
    onboardingRequests,
    totalFiltered,
    openCount,
    closedCount,
    newOnboardingCount,
  ] = await Promise.all([
    prisma.platformMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
    prisma.platformMessage.count({ where: { status: "OPEN" } }),
    prisma.platformMessage.count({ where: { status: { not: "OPEN" } } }),
    prisma.onboardingRequest.count({ where: { status: "NEW" } }),
  ]);

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
        <StatCard label="Closed / other" value={closedCount} />
        <StatCard label="New onboarding" value={newOnboardingCount} />
      </section>

      <section className="overflow-hidden rounded-[26px] border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-neutral-950">
              New onboarding requests
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Public access requests submitted from the registration page.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={toneForStatus(newOnboardingCount > 0 ? "pending" : "closed")}>
              {newOnboardingCount} new
            </Badge>
            <Link
              href="/platform/onboarding"
              className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              Manage
            </Link>
          </div>
        </div>

        {onboardingRequests.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-500">
            No onboarding requests found.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {onboardingRequests.map((request) => (
              <article key={request.id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-neutral-950">
                      {request.companyName}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-500">
                      {request.fullName} • {request.managedPropertyType}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Badge tone={toneForStatus(request.status === "NEW" ? "pending" : request.status)}>
                      {request.status}
                    </Badge>
                    <Badge>{formatDateTime(request.createdAt)}</Badge>
                  </div>
                </div>

                {request.message ? (
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-neutral-700">
                    {request.message}
                  </p>
                ) : null}

                <p className="mt-4 text-xs text-neutral-500">
                  Contact: {request.workEmail}
                  {request.phone ? ` • ${request.phone}` : ""}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-[26px] border border-neutral-200 bg-white shadow-sm">
        <form className="grid gap-3 border-b border-neutral-200 p-4 md:grid-cols-[1fr_180px_auto]">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search subject, message, org, or sender"
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none"
          />
          <select
            name="status"
            defaultValue={status}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium outline-none"
          >
            <option value="">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
          </select>
          <button className="rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white">
            Apply
          </button>
        </form>

        {messages.length === 0 ? (
          <div className="p-10 text-center text-sm text-neutral-500">No messages found.</div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {messages.map((message) => (
              <article key={message.id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-neutral-950">
                      {message.subject}
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      {message.org.name} / {message.org.slug} • {message.sender.fullName}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Badge tone={toneForStatus(message.status)}>{message.status}</Badge>
                    <Badge>{formatDateTime(message.createdAt)}</Badge>
                  </div>
                </div>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-neutral-700">
                  {message.message}
                </p>

                <p className="mt-4 text-xs text-neutral-500">
                  Contact: {message.sender.email ?? "No email"}
                  {message.sender.phone ? ` • ${message.sender.phone}` : ""}
                </p>
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
