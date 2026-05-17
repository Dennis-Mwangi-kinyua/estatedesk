import Link from "next/link";
import { requireCurrentOrgId } from "@/lib/auth/org";
import { prisma } from "@/lib/prisma";
import { ROLE_META, STAFF_ROLES, type StaffRole } from "@/features/staff/constants/role-meta";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(value);
}

function workedFor(start: Date, end: Date | null) {
  const finish = end ?? new Date();
  const days = Math.max(0, Math.floor((finish.getTime() - start.getTime()) / 86400000));

  if (days < 31) return `${days} day${days === 1 ? "" : "s"}`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return remainingMonths
    ? `${years} yr ${remainingMonths} mo`
    : `${years} yr${years === 1 ? "" : "s"}`;
}

export default async function PreviousEmployeesPage() {
  const orgId = await requireCurrentOrgId();

  const previousEmployees = await prisma.membership.findMany({
    where: {
      orgId,
      role: {
        in: [...STAFF_ROLES],
      },
      employmentEndedAt: {
        not: null,
      },
      user: {
        deletedAt: null,
      },
    },
    orderBy: [{ employmentEndedAt: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      role: true,
      employmentStartedAt: true,
      employmentEndedAt: true,
      employmentExitReason: true,
      deactivationNotes: true,
      deactivatedAt: true,
      user: {
        select: {
          fullName: true,
          email: true,
          phone: true,
          status: true,
        },
      },
    },
  });

  return (
    <div className="space-y-5 text-slate-950 dark:text-slate-100">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Staff register
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              Previous employees
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              A register of staff whose organisation access has ended, including
              when they worked and why the account was deactivated.
            </p>
          </div>

          <Link
            href="/staff"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Back to active staff
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Previous employees" value={previousEmployees.length} />
          <StatCard
            label="Disabled accounts"
            value={previousEmployees.filter((item) => item.user.status === "DISABLED").length}
          />
          <StatCard
            label="Roles represented"
            value={new Set(previousEmployees.map((item) => item.role)).size}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
        {previousEmployees.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No previous employees have been registered yet.
          </div>
        ) : (
          <div className="grid gap-3 p-4 lg:grid-cols-2">
            {previousEmployees.map((employee) => {
              const role = employee.role as StaffRole;
              const meta = ROLE_META[role];

              return (
                <article
                  key={employee.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                        {employee.user.fullName}
                      </h2>
                      <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                        {employee.user.email ?? employee.user.phone ?? "No contact"}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 ${meta.badgeClass}`}>
                      {meta.label}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm">
                    <InfoLine label="Started" value={formatDate(employee.employmentStartedAt)} />
                    <InfoLine label="Ended" value={formatDate(employee.employmentEndedAt)} />
                    <InfoLine
                      label="Worked"
                      value={workedFor(employee.employmentStartedAt, employee.employmentEndedAt)}
                    />
                    <InfoLine label="Reason" value={employee.employmentExitReason ?? "—"} />
                    <InfoLine label="Account" value={employee.user.status} />
                  </div>

                  {employee.deactivationNotes ? (
                    <p className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
                      {employee.deactivationNotes}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-white/10 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-t border-slate-200 pt-2 first:border-t-0 first:pt-0 dark:border-white/10">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </span>
      <span className="text-right font-medium text-slate-700 dark:text-slate-200">
        {value}
      </span>
    </div>
  );
}
