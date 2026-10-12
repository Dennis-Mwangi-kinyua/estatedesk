import { ResponsiveDataList, DataCardRow } from "@/components/ui/responsive-data-list";
import { EmojiSticker as VisualSticker } from "@/components/shared/emoji-sticker";
import { formatCurrency, formatDate, getChargeStatusClass } from "../_lib/helpers";
import type { LeaseDetailsData } from "../_lib/types";

export function LeaseTaxChargesPanel({
  lease,
  currencyCode,
}: {
  lease: LeaseDetailsData["lease"];
  currencyCode: string;
}) {
  return (
    <section className="overflow-hidden workspace-panel min-w-0 rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b px-4 py-3">
        <h2 className="flex items-center gap-3 text-base font-semibold"><VisualSticker label="Tax Charges" size="xs" />Tax Charges</h2>
      </div>

      {lease.taxCharges.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No tax charges found.
        </div>
      ) : (
        <ResponsiveDataList desktopBreakpoint="2xl" mobile={
          <ul className="grid min-w-0 gap-3 bg-muted/15 p-3 md:grid-cols-2 sm:p-4">
            {lease.taxCharges.map((charge) => (
              <li key={charge.id} className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-4 flex items-center gap-3"><VisualSticker label="Tax charges" /><h3 className="text-sm font-semibold">Tax charge</h3></div>
                <dl className="space-y-3">

                    <DataCardRow label="Period" value={<>{charge.period}</>} />
                    <DataCardRow label="Tax Type" value={<>{charge.taxType}</>} />
                    <DataCardRow label="Authority" value={<>{charge.taxAuthority}</>} />
                    <DataCardRow label="Amount Due" value={<>{formatCurrency(charge.amountDue, currencyCode)}</>} />
                    <DataCardRow label="Amount Paid" value={<>{formatCurrency(charge.amountPaid, currencyCode)}</>} />
                    <DataCardRow label="Balance" value={<>{formatCurrency(charge.balance, currencyCode)}</>} />
                    <DataCardRow label="Due Date" value={<>{formatDate(charge.dueDate)}</>} />
                    <DataCardRow label="Status" value={<><span
                      className={`inline-flex shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs ${getChargeStatusClass(
                        charge.status
                      )}`}
                    >
                      {charge.status}
                    </span></>} />
                </dl>
              </li>
            ))}
          </ul>
        } desktop={
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Charge</th>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Tax Type</th>
                <th className="px-4 py-3 font-medium">Authority</th>
                <th className="px-4 py-3 font-medium">Amount Due</th>
                <th className="px-4 py-3 font-medium">Amount Paid</th>
                <th className="px-4 py-3 font-medium">Balance</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {lease.taxCharges.map((charge) => (
                <tr key={charge.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{charge.id}</td>
                  <td className="px-4 py-3">{charge.period}</td>
                  <td className="px-4 py-3">{charge.taxType}</td>
                  <td className="px-4 py-3">{charge.taxAuthority}</td>
                  <td className="px-4 py-3">
                    {formatCurrency(charge.amountDue, currencyCode)}
                  </td>
                  <td className="px-4 py-3">
                    {formatCurrency(charge.amountPaid, currencyCode)}
                  </td>
                  <td className="px-4 py-3">
                    {formatCurrency(charge.balance, currencyCode)}
                  </td>
                  <td className="px-4 py-3">{formatDate(charge.dueDate)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs ${getChargeStatusClass(
                        charge.status
                      )}`}
                    >
                      {charge.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        } />
      )}
    </section>
  );
}