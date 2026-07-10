import type { OrgRole } from "@prisma/client";
import {
  approveExpenditureAction,
  payApprovedExpenditureAction,
  rejectExpenditureAction,
} from "../actions";
import {
  formatCategory,
  formatDate,
  formatMoney,
  formatScope,
} from "../_lib/helpers";
import type { OrgExpendituresPageData } from "../_lib/types";
import { ExpenditureStatusPill, panelShellClassName } from "./expenditures-ui";
import { ExpendituresEmptyState } from "./expenditures-empty-state";
import { ExpendituresPagination } from "./expenditures-pagination";

export function ExpendituresDirectorySection({
  data,
  orgRole,
}: {
  data: OrgExpendituresPageData;
  orgRole?: OrgRole | null;
}) {
  const {
    expenditures,
    totalExpenditures,
    currentPage,
    totalPages,
    showingFrom,
    showingTo,
  } = data;
  const canReview = orgRole === "ADMIN" || orgRole === "ACCOUNTANT";

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Expenditure history
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Review recorded organization and tenant-linked costs with status and amount.
        </p>
      </div>

      {expenditures.length === 0 ? (
        <ExpendituresEmptyState />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-muted/20">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Date
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Description
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Scope
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Tenant
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Amount
                  </th>
                  {canReview ? (
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Review
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {expenditures.map((expenditure) => (
                  <tr
                    key={expenditure.id}
                    className="border-b border-border/70 transition hover:bg-muted/10"
                  >
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(expenditure.incurredAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {expenditure.description}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatCategory(expenditure.category)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatScope(expenditure.scope)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {expenditure.tenant?.fullName ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <ExpenditureStatusPill status={expenditure.status} />
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {formatMoney(
                        Number(expenditure.amount),
                        expenditure.currencyCode,
                      )}
                    </td>
                    {canReview ? (
                      <td className="px-4 py-3">
                        {expenditure.status === "PENDING_APPROVAL" ? (
                          <div className="flex min-w-[12rem] flex-col gap-2">
                            <form action={approveExpenditureAction}>
                              <input
                                type="hidden"
                                name="expenditureId"
                                value={expenditure.id}
                              />
                              <button
                                type="submit"
                                className="w-full rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                              >
                                Approve
                              </button>
                            </form>
                            <form action={rejectExpenditureAction} className="space-y-2">
                              <input
                                type="hidden"
                                name="expenditureId"
                                value={expenditure.id}
                              />
                              <input
                                name="reason"
                                required
                                placeholder="Rejection reason"
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                              />
                              <button
                                type="submit"
                                className="w-full rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
                              >
                                Reject
                              </button>
                            </form>
                          </div>
                        ) : expenditure.status === "APPROVED" ? (
                          <form action={payApprovedExpenditureAction} className="space-y-2">
                            <input
                              type="hidden"
                              name="expenditureId"
                              value={expenditure.id}
                            />
                            <input
                              name="paidAt"
                              type="date"
                              defaultValue={new Date().toISOString().slice(0, 10)}
                              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                            />
                            <button
                              type="submit"
                              className="w-full rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                            >
                              Mark paid & post
                            </button>
                          </form>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ExpendituresPagination
            currentPage={currentPage}
            totalPages={totalPages}
            showingFrom={showingFrom}
            showingTo={showingTo}
            totalExpenditures={totalExpenditures}
          />
        </>
      )}
    </section>
  );
}