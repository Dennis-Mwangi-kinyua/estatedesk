import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { ActionForm, TextField, panelClass, inputClass } from "@/features/providers/forms";
import { moderateProvider, dismissProviderReport } from "@/features/providers/actions";
import { ONLINE_WINDOW_MS, providerIsOnline } from "@/features/providers/policy";

export const dynamic = "force-dynamic";

type ProviderStatus = "PENDING" | "ACTIVE" | "FLAGGED" | "SUSPENDED" | "DELETED";

function ModerationFields({
  providerId,
  reportId,
  initialStatus = "FLAGGED",
}: {
  providerId: string;
  reportId?: string;
  initialStatus?: ProviderStatus;
}) {
  return (
    <>
      <input type="hidden" name="providerId" value={providerId} />
      {reportId ? <input type="hidden" name="reportId" value={reportId} /> : null}
      <label className="block text-sm">
        Action
        <select name="status" defaultValue={initialStatus} className={inputClass}>
          <option value="PENDING">Keep pending approval</option>
          <option value="FLAGGED">Flag and hide pending review</option>
          <option value="SUSPENDED">Suspend provider access</option>
          <option value="ACTIVE">Approve / activate provider</option>
          <option value="DELETED">Remove profile permanently</option>
        </select>
      </label>
      <TextField name="reason" label="Review reason (saved to audit history)" maxLength={2000} />
      <p className="text-xs text-muted-foreground">
        New providers must verify their email before approval. Approving sends
        their username and sign-in instructions by email. Removal deletes the
        public profile and portfolio while retaining job, review, and report
        records for accountability.
      </p>
    </>
  );
}

export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]);
  const filters = await searchParams;
  const status = ["PENDING", "ACTIVE", "FLAGGED", "SUSPENDED", "DELETED"].find(
    (value) => value === filters.status,
  ) as ProviderStatus | undefined;
  const q = typeof filters.q === "string" ? filters.q.trim().slice(0, 120) : "";
  const now = new Date();
  const onlineWindowStart = new Date(now.getTime() - ONLINE_WINDOW_MS);

  const [total, pending, active, flagged, suspended, removed, online, reports, providers] = await Promise.all([
    prisma.serviceProvider.count(),
    prisma.serviceProvider.count({ where: { status: "PENDING" } }),
    prisma.serviceProvider.count({ where: { status: "ACTIVE" } }),
    prisma.serviceProvider.count({ where: { status: "FLAGGED" } }),
    prisma.serviceProvider.count({ where: { status: "SUSPENDED" } }),
    prisma.serviceProvider.count({ where: { status: "DELETED" } }),
    prisma.serviceProvider.count({
      where: {
        status: { in: ["ACTIVE", "FLAGGED"] },
        lastSeenAt: { gte: onlineWindowStart },
        user: {
          status: "ACTIVE",
          deletedAt: null,
          sessions: { some: { expiresAt: { gt: now }, lastSeenAt: { gte: onlineWindowStart } } },
        },
      },
    }),
    prisma.providerReport.findMany({
      where: { resolvedAt: null },
      include: {
        provider: { select: { businessName: true, status: true } },
        org: { select: { name: true } },
        job: { select: { title: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    }),
    prisma.serviceProvider.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q ? {
          OR: [
            { businessName: { contains: q, mode: "insensitive" } },
            { location: { contains: q, mode: "insensitive" } },
          ],
        } : {}),
      },
      include: {
        user: {
          select: {
            fullName: true,
            username: true,
            email: true,
            emailVerified: true,
            status: true,
            deletedAt: true,
            sessions: {
              where: { expiresAt: { gt: now }, lastSeenAt: { gte: onlineWindowStart } },
              select: { id: true },
            },
          },
        },
        _count: { select: { jobs: true, reports: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const stats = [
    ["Registered", total],
    ["Awaiting review", pending],
    ["Active", active],
    ["Online now", online],
    ["Flagged", flagged],
    ["Suspended", suspended],
    ["Removed", removed],
  ] as const;

  return (
    <main className="space-y-8 p-4 sm:p-6">
      <header>
        <h1 className="text-3xl font-bold">Service provider oversight</h1>
        <p className="mt-2 text-muted-foreground">
          Review new applications, verify email ownership, and manage provider
          reports. Every moderation action records the operator and reason.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 2xl:grid-cols-7">
        {stats.map(([label, count]) => (
          <div key={label} className={panelClass}>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-bold">{count}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        Online means provider-portal activity within five minutes with a valid
        account session. Refresh this page for current totals.
      </p>

      <section>
        <h2 className="mb-4 text-2xl font-bold">Reports awaiting review</h2>
        <div className="space-y-4">
          {reports.map((report) => (
            <article key={report.id} className={panelClass}>
              <h3 className="text-xl font-semibold">{report.provider.businessName}</h3>
              <p className="text-sm text-primary">
                Reported by {report.org.name} · {report.job.title} · {report.provider.status}
              </p>
              <p className="my-4 whitespace-pre-line">{report.reason}</p>
              {report.provider.status !== "DELETED" ? (
                <details>
                  <summary className="cursor-pointer font-semibold text-destructive">Review provider account</summary>
                  <div className="mt-3 max-w-xl">
                    <ActionForm action={moderateProvider} label="Apply moderation and resolve report" danger>
                      <ModerationFields
                        providerId={report.providerId}
                        reportId={report.id}
                        initialStatus={report.provider.status === "PENDING" ? "ACTIVE" : "FLAGGED"}
                      />
                    </ActionForm>
                  </div>
                </details>
              ) : null}
              <details className="mt-4">
                <summary className="cursor-pointer font-semibold">Dismiss report without account change</summary>
                <div className="mt-3 max-w-xl">
                  <ActionForm action={dismissProviderReport} label="Resolve report">
                    <input type="hidden" name="reportId" value={report.id} />
                    <TextField name="reason" label="Review outcome and reason" maxLength={2000} />
                  </ActionForm>
                </div>
              </details>
            </article>
          ))}
          {!reports.length ? <p className={panelClass}>No pending provider reports.</p> : null}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">Registered providers</h2>
        <form className={`${panelClass} mb-4 flex flex-wrap items-end gap-3`}>
          <label className="text-sm">
            Name or location
            <input name="q" defaultValue={q} className={inputClass} maxLength={120} />
          </label>
          <label className="text-sm">
            Status
            <select name="status" defaultValue={status ?? ""} className={inputClass}>
              <option value="">All statuses</option>
              {["PENDING", "ACTIVE", "FLAGGED", "SUSPENDED", "DELETED"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <button className="rounded-xl bg-primary px-4 py-3 text-primary-foreground">Filter</button>
        </form>

        <div className="grid items-start gap-4 lg:grid-cols-2">
          {providers.map((provider) => (
            <article key={provider.id} className={panelClass}>
              <h3 className="text-xl font-bold">{provider.businessName}</h3>
              <p className="mt-2 text-sm text-primary">
                {provider.category} · {provider.location} · {provider.status}
              </p>
              <p className="mt-2 text-sm">{provider.user.fullName} · {provider.user.email}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Username: {provider.user.username ?? "Not set"} · Email {provider.user.emailVerified ? "verified" : "not verified"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {provider.status === "PENDING"
                  ? "Awaiting provider review"
                  : ["ACTIVE", "FLAGGED"].includes(provider.status)
                    && provider.user.status === "ACTIVE"
                    && !provider.user.deletedAt
                    && provider.user.sessions.length
                    && providerIsOnline(provider.lastSeenAt, now)
                    ? "Online"
                    : "Offline"}
                {" · "}{provider._count.jobs} jobs · {provider._count.reports} reports
              </p>
              {provider.status !== "DELETED" ? (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-destructive">
                    {provider.status === "PENDING" ? "Review application" : "Manage provider account"}
                  </summary>
                  <div className="mt-3">
                    <ActionForm action={moderateProvider} label="Save review" danger>
                      <ModerationFields providerId={provider.id} initialStatus={provider.status === "PENDING" ? "ACTIVE" : "FLAGGED"} />
                    </ActionForm>
                  </div>
                </details>
              ) : null}
            </article>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Showing up to 100 providers and 100 pending reports. Filter providers to narrow results.
        </p>
      </section>
    </main>
  );
}
