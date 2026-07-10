import Link from "next/link";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import {
  formatDate,
  formatMoney,
  getBillStatusBadgeClasses,
} from "../_lib/helpers";
import type { CombinedBill } from "../_lib/types";

function BillActions({ bill }: { bill: CombinedBill }) {
  if (bill.isPaid) {
    return bill.receiptUrl ? (
      <Link
        href={bill.receiptUrl}
        className="inline-flex items-center rounded-[16px] bg-neutral-900 px-4 py-3 text-sm font-medium text-white"
      >
        Download Receipt
      </Link>
    ) : (
      <span className="inline-flex items-center rounded-[16px] border border-neutral-300 bg-card px-4 py-3 text-sm text-muted-foreground">
        Paid
      </span>
    );
  }

  if (bill.payNowHref) {
    return (
      <Link
        href={bill.payNowHref}
        className="inline-flex items-center rounded-[16px] bg-neutral-900 px-4 py-3 text-sm font-medium text-white"
      >
        Pay Now
      </Link>
    );
  }

  return null;
}

function BillActionsTable({ bill }: { bill: CombinedBill }) {
  if (bill.isPaid) {
    return bill.receiptUrl ? (
      <Link
        href={bill.receiptUrl}
        className="inline-flex items-center rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
      >
        Download Receipt
      </Link>
    ) : (
      <span className="text-sm text-muted-foreground">Paid</span>
    );
  }

  if (bill.payNowHref) {
    return (
      <Link
        href={bill.payNowHref}
        className="inline-flex items-center rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
      >
        Pay Now
      </Link>
    );
  }

  return <span className="text-sm text-neutral-400">—</span>;
}

export function BillHistory({
  bills,
  totalBilled,
  totalBalance,
}: {
  bills: CombinedBill[];
  totalBilled: number;
  totalBalance: number;
}) {
  return (
    <section className="rounded-[28px] ed-theme-card border border-border bg-card p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-6 xl:p-7">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-foreground">
            Bill History
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Unified list of rent, water bill, service charge, and garbage
          </p>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {bills.length} items
        </span>
      </div>

      {bills.length ? (
        <>
          <div className="mt-5 space-y-3 lg:hidden">
            {bills.map((bill) => (
              <div
                key={`${bill.source}-${bill.id}`}
                className="rounded-[22px] ed-theme-card border border-border bg-muted/35 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {bill.typeLabel}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {bill.period}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${getBillStatusBadgeClasses(
                      bill,
                    )}`}
                  >
                    {bill.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-[16px] border border-border/60 bg-card px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Due Date
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {formatDate(bill.dueDate)}
                    </p>
                  </div>

                  <div className="rounded-[16px] border border-border/60 bg-card px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Amount
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {formatMoney(bill.amountDue)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-[16px] border border-border/60 bg-card px-3 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Balance
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {formatMoney(bill.balance)}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <BillActions bill={bill} />
                </div>

                {bill.description ? (
                  <div className="mt-3 rounded-[16px] border border-border/60 bg-card px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Notes
                    </p>
                    <p className="mt-1 text-sm text-foreground/80">
                      {bill.description}
                    </p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-5 hidden overflow-hidden rounded-[24px] ed-theme-card border border-border bg-card lg:block">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr className="text-left text-muted-foreground">
                  <th className="px-5 py-4 font-medium">Bill Type</th>
                  <th className="px-5 py-4 font-medium">Period</th>
                  <th className="px-5 py-4 font-medium">Due Date</th>
                  <th className="px-5 py-4 font-medium">Amount Due</th>
                  <th className="px-5 py-4 font-medium">Balance</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr
                    key={`${bill.source}-${bill.id}`}
                    className="border-b border-neutral-100 last:border-0"
                  >
                    <td className="px-5 py-4 font-semibold text-foreground">
                      {bill.typeLabel}
                    </td>
                    <td className="px-5 py-4 text-neutral-600">{bill.period}</td>
                    <td className="px-5 py-4 text-neutral-600">
                      {formatDate(bill.dueDate)}
                    </td>
                    <td className="px-5 py-4 text-neutral-600">
                      {formatMoney(bill.amountDue)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-foreground">
                      {formatMoney(bill.balance)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getBillStatusBadgeClasses(
                          bill,
                        )}`}
                      >
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <BillActionsTable bill={bill} />
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot className="border-t border-border bg-muted/35">
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-4 text-sm font-semibold text-foreground"
                  >
                    Total Bill
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-foreground">
                    {formatMoney(totalBilled)}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-foreground">
                    {formatMoney(totalBalance)}
                  </td>
                  <td className="px-5 py-4" />
                  <td className="px-5 py-4" />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      ) : (
        <div className="mt-5 ed-theme-muted-panel rounded-[20px] p-4 text-center text-sm text-muted-foreground">
          <p>No bills found.</p>
          <div className="mt-3">
            <InAppGuideLink topic="rent" workspace="tenant" />
          </div>
        </div>
      )}
    </section>
  );
}