import { CsvImportForm } from "./import-form";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function OrgImportsPage() {
  const session = await requireManagementAccess();
  const history = await prisma.importRun.findMany({
    where: { orgId: session.activeOrgId! },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      id: true,
      kind: true,
      mode: true,
      status: true,
      totalRows: true,
      createdRows: true,
      errorCount: true,
      rollbackSummary: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-5">
      <section className="ios-panel rounded-[28px] p-4 sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
          Data onboarding
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
          Import portfolio records
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
          Bring properties, units, and tenants into EstateDesk from CSV. Use
          validation mode to preview errors before committing records.
        </p>
      </section>
      <CsvImportForm />
      <section className="ios-panel rounded-[28px] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-neutral-950">Import history</p>
            <p className="mt-1 text-sm text-neutral-500">
              Recent validation and commit attempts for this organization.
            </p>
          </div>
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
            {history.length} recent
          </span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-xs uppercase tracking-[0.12em] text-neutral-500">
                <th className="py-3 pr-4 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Mode</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Rows</th>
                <th className="py-3 pl-4 text-right font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {history.map((run) => (
                <tr key={run.id}>
                  <td className="py-3 pr-4 text-neutral-600">
                    {run.createdAt.toLocaleString("en-KE", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-3 font-semibold text-neutral-950">{run.kind}</td>
                  <td className="px-4 py-3 text-neutral-600">{run.mode}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        run.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {run.status}
                    </span>
                    {run.errorCount > 0 ? (
                      <p className="mt-1 text-xs text-red-600">{run.errorCount} errors</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-700">{run.totalRows}</td>
                  <td className="py-3 pl-4 text-right font-semibold text-neutral-950">
                    {run.createdRows}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {history.length === 0 ? (
            <div className="border-t border-neutral-100 py-8 text-center text-sm text-neutral-500">
              No imports have been run yet.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
