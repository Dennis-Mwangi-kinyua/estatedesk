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
import {
  quickUpdateOnboardingStatusAction,
  updateOnboardingRequestAction,
} from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  page?: string;
  pageSize?: string;
  q?: string;
  status?: string;
}>;

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "CLOSED", "REJECTED"] as const;

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
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const status = (params.status ?? "").trim().toUpperCase();
  const { page, pageSize, skip, take } = getPagination({
    page: Number(params.page ?? 1),
    pageSize: Number(params.pageSize ?? 20),
  });
  const where = buildWhere({ q, status });

  const [requests, totalFiltered, newCount, contactedCount, qualifiedCount, closedCount] =
    await Promise.all([
      prisma.onboardingRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          handledBy: { select: { fullName: true, email: true } },
          marketer: { select: { fullName: true, referralCode: true } },
        },
      }),
      prisma.onboardingRequest.count({ where }),
      prisma.onboardingRequest.count({ where: { status: "NEW" } }),
      prisma.onboardingRequest.count({ where: { status: "CONTACTED" } }),
      prisma.onboardingRequest.count({ where: { status: "QUALIFIED" } }),
      prisma.onboardingRequest.count({ where: { status: { in: ["CLOSED", "REJECTED"] } } }),
    ]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Growth"
        title="Onboarding requests"
        description="Public access requests from registration, with lead status, contact details, and platform team notes."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Matching" value={totalFiltered} />
        <StatCard label="New" value={newCount} />
        <StatCard label="Contacted" value={contactedCount} />
        <StatCard label="Qualified" value={qualifiedCount} />
        <StatCard label="Closed / rejected" value={closedCount} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/90">
        <form className="grid gap-3 border-b border-slate-100 p-4 dark:border-white/10 md:grid-cols-[1fr_180px_auto]">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search company, contact, email, phone, or notes"
            className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-400 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <select
            name="status"
            defaultValue={status}
            className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none focus:border-slate-400 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="">All statuses</option>
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button className="min-h-11 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
            Apply
          </button>
        </form>

        {requests.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-300">
            No onboarding requests found.
          </div>
        ) : (
          <div className="grid gap-4 p-4">
            {requests.map((request) => (
              <article
                key={request.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950 sm:p-5"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <h2 className="break-words text-base font-semibold text-slate-950 dark:text-white">
                      {request.companyName}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                      {request.fullName} • {request.managedPropertyType}
                    </p>
                    <p className="mt-2 break-words text-sm text-slate-600 dark:text-slate-300">
                      {request.workEmail}
                      {request.phone ? ` • ${request.phone}` : ""}
                    </p>
                    <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      Marketer:{" "}
                      {request.marketer
                        ? `${request.marketer.fullName} (${request.marketer.referralCode})`
                        : request.referralCode
                          ? `Unmatched referral ${request.referralCode}`
                          : "Unassigned"}
                      {request.commissionRate
                        ? ` • ${request.commissionRate.toString()}%`
                        : ""}
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
                  <p className="mt-4 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
                    {request.message}
                  </p>
                ) : null}

                <form
                  action={updateOnboardingRequestAction}
                  className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900 lg:grid-cols-[180px_1fr_auto]"
                >
                  <input type="hidden" name="requestId" value={request.id} />
                  <select
                    name="status"
                    defaultValue={request.status}
                    className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-950 outline-none focus:border-slate-400 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100"
                  >
                    {STATUSES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <textarea
                    name="internalNotes"
                    defaultValue={request.internalNotes ?? ""}
                    rows={2}
                    placeholder="Internal follow-up notes"
                    className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-400 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                  <button className="min-h-11 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
                    Save
                  </button>
                </form>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  {request.handledBy ? (
                    <span>
                      Last handled by {request.handledBy.fullName ?? request.handledBy.email}{" "}
                      {request.handledAt ? `on ${formatDateTime(request.handledAt)}` : ""}
                    </span>
                  ) : (
                    <span>Not handled yet</span>
                  )}
                  <form action={quickUpdateOnboardingStatusAction}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <input type="hidden" name="status" value="CONTACTED" />
                    <button className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                      Mark contacted
                    </button>
                  </form>
                  <form action={quickUpdateOnboardingStatusAction}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <input type="hidden" name="status" value="CLOSED" />
                    <button className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                      Close
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
          basePath="/platform/onboarding"
          query={{ q, status }}
        />
      </section>
    </div>
  );
}
