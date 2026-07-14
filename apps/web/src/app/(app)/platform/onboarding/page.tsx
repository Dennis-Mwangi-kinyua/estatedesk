import { Prisma } from "@prisma/client";
import { CheckCircle2, Clock3, Mail, Phone, Search, Trash2, UserRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getPagination } from "@/lib/db/pagination";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import {
  Badge,
  PageHeader,
  PaginationControls,
  StatCard,
  formatDateTime,
  toneForStatus,
} from "../_components/control-plane";
import {
  deleteOnboardingRequestAction,
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

function onboardingQuery<T>(label: string, operation: () => Promise<T>) {
  return retryTransientDatabaseOperation(operation, {
    attempts: 4,
    delayMs: 650,
    label,
  });
}

function getPriorityLabel(status: string) {
  if (status === "NEW") return "Needs first response";
  if (status === "CONTACTED") return "Awaiting qualification";
  if (status === "QUALIFIED") return "Ready for setup";
  if (status === "CLOSED") return "Completed";
  return "No further action";
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
      onboardingQuery("platform-onboarding-requests", () =>
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
        prisma.onboardingRequest.count({ where: { status: { in: ["CLOSED", "REJECTED"] } } }),
      ),
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
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search company, contact, email, phone, or notes"
              className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-400 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </label>
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
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950"
              >
                <div className="border-b border-slate-100 p-4 dark:border-white/10 sm:p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="break-words text-base font-semibold text-slate-950 dark:text-white">
                          {request.companyName}
                        </h2>
                        <Badge tone={toneForStatus(request.status === "NEW" ? "pending" : request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-300">
                        <UserRound className="h-4 w-4 shrink-0" />
                        <span className="break-words">{request.fullName}</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Badge>{getPriorityLabel(request.status)}</Badge>
                      <Badge>
                        <Clock3 className="mr-1 h-3.5 w-3.5" />
                        {formatDateTime(request.createdAt)}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2 xl:grid-cols-4">
                    <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 dark:border-white/10 dark:bg-slate-900">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="break-all">{request.workEmail}</span>
                    </span>
                    {request.phone ? (
                      <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 dark:border-white/10 dark:bg-slate-900">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{request.phone}</span>
                      </span>
                    ) : null}
                    <span className="inline-flex min-h-9 items-center rounded-full border border-slate-200 bg-slate-50 px-3 font-medium dark:border-white/10 dark:bg-slate-900">
                      {request.managedPropertyType}
                    </span>
                    <span className="inline-flex min-h-9 items-center rounded-full border border-slate-200 bg-slate-50 px-3 dark:border-white/10 dark:bg-slate-900">
                      {request.marketer
                        ? `${request.marketer.fullName} (${request.marketer.referralCode})`
                        : request.referralCode
                          ? `Unmatched ${request.referralCode}`
                          : "No referral"}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
                  <div className="space-y-3">
                    {request.message ? (
                      <p className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
                        {request.message}
                      </p>
                    ) : (
                      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400">
                        No customer message was included.
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      {request.handledBy ? (
                        <span>
                          Last handled by {request.handledBy.fullName ?? request.handledBy.email}{" "}
                          {request.handledAt ? `on ${formatDateTime(request.handledAt)}` : ""}
                        </span>
                      ) : (
                        <span>Not handled yet</span>
                      )}
                      {request.commissionRate ? (
                        <span>Commission {request.commissionRate.toString()}%</span>
                      ) : null}
                    </div>
                  </div>

                  <form
                    action={updateOnboardingRequestAction}
                    className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900"
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
                      rows={3}
                      placeholder="Internal follow-up notes"
                      className="min-h-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-400 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                    <div className="platform-action-group">
                      <button className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
                        <CheckCircle2 className="h-4 w-4" />
                        Save
                      </button>
                    </div>
                  </form>
                </div>

                <div className="platform-action-group border-t border-slate-100 p-4 dark:border-white/10 sm:px-5">
                  {request.status === "NEW" ? (
                    <form action={quickUpdateOnboardingStatusAction}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <input type="hidden" name="status" value="CONTACTED" />
                      <button className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                        <Phone className="h-3.5 w-3.5" />
                        Mark contacted
                      </button>
                    </form>
                  ) : null}
                  {request.status !== "CLOSED" ? (
                    <form action={quickUpdateOnboardingStatusAction}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <input type="hidden" name="status" value="CLOSED" />
                      <button className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Close
                      </button>
                    </form>
                  ) : null}
                  <form
                    action={deleteOnboardingRequestAction}
                    className="platform-action-danger"
                  >
                    <input type="hidden" name="requestId" value={request.id} />
                    <button className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-100 dark:border-red-300/30 dark:bg-red-300/10 dark:text-red-100 dark:hover:bg-red-300/20">
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
          basePath="/platform/onboarding"
          query={{ q, status }}
        />
      </section>
    </div>
  );
}
