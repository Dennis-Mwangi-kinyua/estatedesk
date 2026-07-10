import Link from "next/link";
import { Fragment } from "react";
import { Droplets, Eye, FileDown, Receipt, Wallet } from "lucide-react";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import {
  formatDate,
  formatMoney,
  formatReadingStatus,
  getBillStatusBadgeClasses,
} from "../_lib/helpers";
import type { CombinedBill, CombinedBillLine } from "../_lib/types";

function IssuancePanel({ bill }: { bill: CombinedBill }) {
  const issuance = bill.issuance;
  if (!issuance) return null;

  const hasDetails =
    issuance.submittedByName || issuance.confirmedByName || issuance.confirmedAt;

  if (!hasDetails) return null;

  return (
    <div className="rounded-[14px] border border-border/70 bg-muted/20 px-3 py-2.5 text-xs">
      <p className="font-semibold uppercase tracking-wide text-muted-foreground">
        Invoice trail
      </p>
      <div className="mt-2 space-y-1 text-foreground/85">
        {issuance.submittedByName ? (
          <p>
            Reading submitted by{" "}
            <span className="font-semibold text-foreground">{issuance.submittedByName}</span>
          </p>
        ) : null}
        {issuance.confirmedByName ? (
          <p>
            Water bill confirmed by{" "}
            <span className="font-semibold text-foreground">{issuance.confirmedByName}</span>
            {issuance.confirmedAt ? (
              <span className="text-muted-foreground">
                {" "}
                on {formatDate(issuance.confirmedAt)}
              </span>
            ) : null}
          </p>
        ) : bill.status === "PENDING APPROVAL" ? (
          <p className="text-sky-800">Awaiting organisation confirmation of the water reading.</p>
        ) : null}
      </div>
    </div>
  );
}

function PreviousBillPanel({ bill }: { bill: CombinedBill }) {
  const previous = bill.previousBill;
  if (!previous) return null;

  return (
    <div className="rounded-[14px] border border-border/70 bg-muted/15 px-3 py-2.5 text-xs">
      <p className="font-semibold uppercase tracking-wide text-muted-foreground">
        Previous bill ({previous.period})
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div>
          <p className="text-muted-foreground">Total billed</p>
          <p className="font-semibold text-foreground">{formatMoney(previous.amountDue)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Paid</p>
          <p className="font-semibold text-foreground">{formatMoney(previous.amountPaid)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Balance</p>
          <p className="font-semibold text-foreground">{formatMoney(previous.balance)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Status</p>
          <p className="font-semibold text-foreground">{previous.status}</p>
        </div>
        {previous.rentTotal != null ? (
          <div>
            <p className="text-muted-foreground">Rent</p>
            <p className="font-semibold text-foreground">{formatMoney(previous.rentTotal)}</p>
          </div>
        ) : null}
        {previous.waterTotal != null ? (
          <div>
            <p className="text-muted-foreground">Water</p>
            <p className="font-semibold text-foreground">{formatMoney(previous.waterTotal)}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function WaterReadingPanel({ detail }: { detail: NonNullable<CombinedBillLine["waterDetail"]> }) {
  return (
    <div className="mt-2 rounded-[14px] border border-sky-200/80 bg-sky-50/60 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-800">
        Meter reading
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div>
          <p className="text-muted-foreground">Previous</p>
          <p className="font-semibold text-foreground">{detail.prevReading}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Current</p>
          <p className="font-semibold text-foreground">{detail.currentReading}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Units used</p>
          <p className="font-semibold text-foreground">{detail.unitsUsed}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Rate / unit</p>
          <p className="font-semibold text-foreground">{formatMoney(detail.ratePerUnit)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Fixed charge</p>
          <p className="font-semibold text-foreground">{formatMoney(detail.fixedCharge)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Reading status</p>
          <p className="font-semibold text-foreground">
            {formatReadingStatus(detail.readingStatus)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Bill status</p>
          <p className="font-semibold text-foreground">
            {formatReadingStatus(detail.billStatus)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Submitted</p>
          <p className="font-semibold text-foreground">
            {formatDate(detail.readingSubmittedAt)}
          </p>
        </div>
        {detail.submittedByName ? (
          <div>
            <p className="text-muted-foreground">Submitted by</p>
            <p className="font-semibold text-foreground">{detail.submittedByName}</p>
          </div>
        ) : null}
        {detail.confirmedByName ? (
          <div>
            <p className="text-muted-foreground">Confirmed by</p>
            <p className="font-semibold text-foreground">{detail.confirmedByName}</p>
          </div>
        ) : null}
      </div>
      {detail.billStatus === "PENDING APPROVAL" ? (
        <p className="mt-2 text-xs leading-5 text-sky-800">
          Awaiting organisation approval. The water charge will become payable once approved.
        </p>
      ) : null}
    </div>
  );
}

function LineItemTable({ bill }: { bill: CombinedBill }) {
  if (!bill.lines?.length) return null;

  return (
    <div className="overflow-hidden rounded-[18px] border border-border/70 bg-card">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2.5 font-medium">Charge</th>
            <th className="px-3 py-2.5 font-medium">Billed</th>
            <th className="px-3 py-2.5 font-medium">Paid</th>
            <th className="px-3 py-2.5 font-medium">Balance</th>
            <th className="px-3 py-2.5 font-medium">Pay</th>
          </tr>
        </thead>
        <tbody>
          {bill.lines.map((line) => (
            <Fragment key={`${bill.id}-${line.kind}-${line.label}`}>
              <tr
                className="border-t border-border/60"
              >
                <td className="px-3 py-3 font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    {line.kind === "WATER" ? (
                      <Droplets className="h-4 w-4 text-sky-600" />
                    ) : null}
                    {line.label}
                  </div>
                </td>
                <td className="px-3 py-3 tabular-nums text-muted-foreground">
                  {formatMoney(line.amountDue)}
                </td>
                <td className="px-3 py-3 tabular-nums text-muted-foreground">
                  {formatMoney(line.amountPaid)}
                </td>
                <td className="px-3 py-3 font-semibold tabular-nums text-foreground">
                  {formatMoney(line.balance)}
                </td>
                <td className="px-3 py-3">
                  {line.payHref && line.balance > 0 ? (
                    <Link
                      href={line.payHref}
                      className="inline-flex items-center rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted/50"
                    >
                      Pay
                    </Link>
                  ) : line.waterDetail?.billStatus === "PENDING APPROVAL" ? (
                    <span className="text-xs text-sky-700">Awaiting approval</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
              {line.waterDetail ? (
                <tr className="border-t border-border/40 bg-sky-50/30">
                  <td colSpan={5} className="px-3 py-3">
                    <WaterReadingPanel detail={line.waterDetail} />
                  </td>
                </tr>
              ) : null}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BillActions({ bill }: { bill: CombinedBill }) {
  return (
    <div className="flex flex-wrap gap-2">
      {bill.invoiceViewUrl ? (
        <Link
          href={bill.invoiceViewUrl}
          className="inline-flex items-center gap-2 rounded-[16px] border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted/40"
        >
          <Eye className="h-4 w-4" />
          View Invoice
        </Link>
      ) : null}

      {bill.invoiceUrl ? (
        <Link
          href={bill.invoiceUrl}
          className="inline-flex items-center gap-2 rounded-[16px] border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted/40"
        >
          <FileDown className="h-4 w-4" />
          Download Invoice
        </Link>
      ) : null}

      {!bill.isPaid && bill.payNowHref ? (
        <Link
          href={bill.payNowHref}
          className="inline-flex items-center gap-2 rounded-[16px] bg-neutral-900 px-4 py-3 text-sm font-medium text-white"
        >
          <Wallet className="h-4 w-4" />
          {bill.amountPaid && bill.amountPaid > 0 ? "Pay balance (all)" : "Pay all together"}
        </Link>
      ) : null}

      {!bill.isPaid && bill.payWaterHref ? (
        <Link
          href={bill.payWaterHref}
          className="inline-flex items-center gap-2 rounded-[16px] border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-800 transition hover:bg-sky-100"
        >
          <Droplets className="h-4 w-4" />
          Pay water only
        </Link>
      ) : null}

      {bill.isPaid ? (
        bill.receiptUrl ? (
          <Link
            href={bill.receiptUrl}
            className="inline-flex items-center gap-2 rounded-[16px] bg-neutral-900 px-4 py-3 text-sm font-medium text-white"
          >
            <Receipt className="h-4 w-4" />
            Download Receipt
          </Link>
        ) : (
          <span className="inline-flex items-center rounded-[16px] border border-neutral-300 bg-card px-4 py-3 text-sm text-muted-foreground">
            Paid
          </span>
        )
      ) : null}
    </div>
  );
}

function BillActionsTable({ bill }: { bill: CombinedBill }) {
  return (
    <div className="flex flex-wrap gap-2">
      {bill.invoiceViewUrl ? (
        <Link
          href={bill.invoiceViewUrl}
          className="inline-flex items-center rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground"
        >
          View
        </Link>
      ) : null}

      {bill.invoiceUrl ? (
        <Link
          href={bill.invoiceUrl}
          className="inline-flex items-center rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground"
        >
          PDF
        </Link>
      ) : null}

      {!bill.isPaid && bill.payNowHref ? (
        <Link
          href={bill.payNowHref}
          className="inline-flex items-center rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
        >
          Pay all
        </Link>
      ) : null}

      {!bill.isPaid && bill.payWaterHref ? (
        <Link
          href={bill.payWaterHref}
          className="inline-flex items-center rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800"
        >
          Water
        </Link>
      ) : null}

      {bill.isPaid ? (
        bill.receiptUrl ? (
          <Link
            href={bill.receiptUrl}
            className="inline-flex items-center rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
          >
            Receipt
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">Paid</span>
        )
      ) : (
        !bill.invoiceViewUrl &&
          !bill.invoiceUrl &&
          !bill.payNowHref &&
          !bill.payWaterHref ? (
          <span className="text-sm text-neutral-400">—</span>
        ) : null
      )}
    </div>
  );
}

export function BillHistory({
  bills,
  totalBilled,
  totalBalance,
  organizationName,
  tenantName,
}: {
  bills: CombinedBill[];
  totalBilled: number;
  totalBalance: number;
  organizationName: string;
  tenantName: string;
}) {
  return (
    <section className="rounded-[28px] ed-theme-card border border-border bg-card p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-6 xl:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-foreground">
            Issued Bills
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            All charges for <span className="font-medium text-foreground">{tenantName}</span> at{" "}
            <span className="font-medium text-foreground">{organizationName}</span> — rent, water
            meter readings, and other issued items. Water readings appear as soon as submitted;
            payment opens after organisation approval.
          </p>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {bills.length} billing {bills.length === 1 ? "period" : "periods"}
        </span>
      </div>

      {bills.length ? (
        <>
          <div className="mt-5 space-y-4 lg:hidden">
            {bills.map((bill) => (
              <article
                key={`${bill.source}-${bill.id}`}
                className="rounded-[22px] ed-theme-card border border-border bg-muted/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {bill.period}
                    </p>
                    <p className="mt-1 text-base font-semibold text-foreground">
                      {bill.typeLabel}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Due {formatDate(bill.dueDate)}
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

                <div className="mt-4 space-y-3">
                  <IssuancePanel bill={bill} />
                  <PreviousBillPanel bill={bill} />
                  <LineItemTable bill={bill} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-[16px] border border-border/60 bg-card px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Total billed
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {formatMoney(bill.amountDue)}
                    </p>
                  </div>
                  <div className="rounded-[16px] border border-border/60 bg-card px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Balance due
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {formatMoney(bill.balance)}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <BillActions bill={bill} />
                </div>
              </article>
            ))}
          </div>

          <div className="mt-5 hidden overflow-hidden rounded-[24px] ed-theme-card border border-border bg-card lg:block">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr className="text-left text-muted-foreground">
                  <th className="px-5 py-4 font-medium">Period</th>
                  <th className="px-5 py-4 font-medium">Charges</th>
                  <th className="px-5 py-4 font-medium">Due Date</th>
                  <th className="px-5 py-4 font-medium">Billed</th>
                  <th className="px-5 py-4 font-medium">Balance</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr
                    key={`${bill.source}-${bill.id}`}
                    className="border-b border-neutral-100 align-top last:border-0"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-foreground">{bill.period}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{bill.typeLabel}</p>
                      {bill.issuance?.confirmedByName ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Confirmed by {bill.issuance.confirmedByName}
                        </p>
                      ) : null}
                      {bill.previousBill ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Prev {bill.previousBill.period}: {formatMoney(bill.previousBill.amountDue)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-neutral-600">
                      {bill.lines?.length ? (
                        <div className="space-y-2">
                          {bill.lines.map((line) => (
                            <div key={`${bill.id}-${line.kind}-${line.label}`}>
                              <div className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/20 px-2.5 py-1.5">
                                <span className="text-xs font-medium text-foreground">
                                  {line.label}
                                </span>
                                <span className="text-xs tabular-nums text-muted-foreground">
                                  {formatMoney(line.balance > 0 ? line.balance : line.amountDue)}
                                </span>
                              </div>
                              {line.waterDetail ? (
                                <div className="mt-1.5 text-[11px] leading-5 text-sky-800">
                                  Reading {line.waterDetail.prevReading} → {line.waterDetail.currentReading}
                                  {" · "}
                                  {line.waterDetail.unitsUsed} units @ {formatMoney(line.waterDetail.ratePerUnit)}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        bill.description
                      )}
                    </td>
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
                    Total across all issued bills
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
          <p>No issued bills yet. Rent and water invoices appear here once charges are issued and approved.</p>
          <div className="mt-3">
            <InAppGuideLink topic="rent" workspace="tenant" />
          </div>
        </div>
      )}
    </section>
  );
}