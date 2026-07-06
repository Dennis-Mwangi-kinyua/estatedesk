import Link from "next/link";
import { createTenantExpenditureAction } from "../actions";
import {
  fieldClassName,
  buildExpendituresPageHref,
  formatCategory,
  formatMoney,
} from "../_lib/helpers";
import type { TenantExpendituresPageData } from "../_lib/types";

export function ExpendituresWorkspace({
  data,
}: {
  data: TenantExpendituresPageData;
}) {
  const {
    tenant,
    expenditures,
    totalExpenditures,
    currentPage,
    totalPages,
    showingFrom,
    showingTo,
  } = data;

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <header>
        <p className="text-sm font-semibold text-emerald-700">
          Personal cost register
        </p>
        <h1 className="text-3xl font-bold">My expenditures</h1>
        <p className="mt-2 text-neutral-600">
          Record costs related to your tenancy and review costs assigned by
          management.
        </p>
      </header>

      <form
        action={createTenantExpenditureAction}
        className="rounded-2xl border bg-white p-5"
      >
        <h2 className="font-bold">Add expenditure</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Description
            <input name="description" required className={fieldClassName} />
          </label>
          <label className="text-sm">
            Category
            <select name="category" className={fieldClassName}>
              <option>TENANT_REPAIR</option>
              <option>TENANT_SERVICE</option>
              <option>TRANSPORT</option>
              <option>OTHER</option>
            </select>
          </label>
          <label className="text-sm">
            Amount ({tenant.org.currencyCode})
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              className={fieldClassName}
            />
          </label>
          <label className="text-sm">
            Date
            <input
              name="incurredAt"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className={fieldClassName}
            />
          </label>
          <label className="text-sm">
            Paid to
            <input name="payee" className={fieldClassName} />
          </label>
          <label className="text-sm">
            Reference
            <input name="reference" className={fieldClassName} />
          </label>
        </div>
        <button className="mt-4 rounded-xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white">
          Save expenditure
        </button>
      </form>

      <section className="space-y-3">
        {expenditures.map((row) => (
          <article key={row.id} className="rounded-xl border bg-white p-4">
            <div className="flex justify-between gap-4">
              <div>
                <h2 className="font-semibold">{row.description}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {row.incurredAt.toLocaleDateString("en-KE")} ·{" "}
                  {formatCategory(row.category)} · {row.status}
                  {row.chargeable ? " · Chargeable" : ""}
                </p>
              </div>
              <strong>
                {formatMoney(Number(row.amount), row.currencyCode)}
              </strong>
            </div>
          </article>
        ))}
      </section>

      {totalExpenditures > showingTo || currentPage > 1 ? (
        <section className="flex flex-col gap-3 rounded-xl border bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {showingFrom}-{showingTo} of {totalExpenditures}
          </p>
          <div className="flex items-center gap-2">
            {currentPage > 1 ? (
              <Link
                href={buildExpendituresPageHref(currentPage - 1)}
                className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
              >
                Previous
              </Link>
            ) : null}
            <span className="rounded-md border bg-muted px-3 py-2 text-sm font-semibold">
              {currentPage} / {totalPages}
            </span>
            {currentPage < totalPages ? (
              <Link
                href={buildExpendituresPageHref(currentPage + 1)}
                className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
              >
                Next
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}