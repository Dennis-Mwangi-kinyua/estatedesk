import { EmojiSticker as VisualSticker } from "@/components/shared/emoji-sticker";
import { ResponsiveDataList, DataCardRow } from "@/components/ui/responsive-data-list";
import { DeferredLink } from "@/components/navigation/app-links";
import { formatCurrency, formatDate } from "../_lib/helpers";
import type { OrgRentCharge } from "../_lib/types";
import { ChargeStatusPill, panelShellClassName } from "./charges-ui";
import { ChargesEmptyState } from "./charges-empty-state";
import { encodePublicId } from "@/lib/public-id";

export function ChargesDirectorySection({ charges }: { charges: OrgRentCharge[] }) {
  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          <VisualSticker label="Rent charges" size="xs" className="mr-2 align-middle" />All rent charges
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Every rent period across active leases, with tenant, property, and balance
          details.
        </p>
      </div>

      {charges.length === 0 ? (
        <ChargesEmptyState />
      ) : (
        <ResponsiveDataList desktopBreakpoint="2xl" mobile={
          <ul className="grid min-w-0 gap-4 bg-muted/15 p-3 md:grid-cols-2 sm:p-4">
            {charges.map((charge) => (
              <li key={charge.id} className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start gap-3"><VisualSticker label="Rent charges" className="shrink-0" /><div className="min-w-0 flex-1"><DeferredLink href={`/dashboard/org/tenants/${encodeURIComponent(charge.lease.tenant.slug ?? charge.lease.tenant.id)}`} className="break-words font-semibold hover:text-primary">{charge.lease.tenant.fullName}</DeferredLink><p className="mt-1 text-xs text-muted-foreground">{charge.period} · {charge.chargeType}</p></div><ChargeStatusPill status={charge.status} /></div>
                <dl className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                  <div className="min-w-0 rounded-xl bg-muted/30 p-3"><dt className="text-xs text-muted-foreground">Amount due</dt><dd className="mt-2 break-words text-lg font-semibold tabular-nums">{formatCurrency(charge.amountDue)}</dd></div>
                  <div className="min-w-0 rounded-xl bg-amber-500/5 p-3"><dt className="text-xs text-muted-foreground">Outstanding</dt><dd className="mt-2 break-words text-lg font-semibold tabular-nums text-amber-700 dark:text-amber-200">{formatCurrency(charge.balance)}</dd></div>
                </dl>
                <dl className="space-y-3 border-t border-border pt-3">
                  <DataCardRow label="Paid" value={formatCurrency(charge.amountPaid)} />
                  <DataCardRow label="Property" value={<DeferredLink href={`/dashboard/org/properties/${encodePublicId(charge.lease.unit.property.id, "property")}`} className="text-primary underline underline-offset-4">{charge.lease.unit.property.name}</DeferredLink>} />
                  <DataCardRow label="Building" value={charge.lease.unit.building?.name ?? "—"} />
                  <DataCardRow label="Unit" value={charge.lease.unit.houseNo} />
                  <DataCardRow label="Due date" value={formatDate(charge.dueDate)} />
                </dl>
                <DeferredLink data-workspace-action="true" href={`/dashboard/org/leases/${encodePublicId(charge.lease.id, "lease")}`} className="mt-auto">View lease</DeferredLink>
              </li>
            ))}
          </ul>
        } desktop={
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-muted/20">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Period
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Type
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Tenant
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Property
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Building
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Unit
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Amount due
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Paid
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Balance
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Due date
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Lease
                </th>
              </tr>
            </thead>
            <tbody>
              {charges.map((charge) => (
                <tr
                  key={charge.id}
                  className="border-b border-border/70 transition hover:bg-muted/10"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {charge.period}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {charge.chargeType}
                  </td>
                  <td className="px-4 py-3">
                    <DeferredLink
                      href={`/dashboard/org/tenants/${encodeURIComponent(charge.lease.tenant.slug ?? charge.lease.tenant.id)}`}
                      className="font-medium text-foreground transition hover:text-primary"
                    >
                      {charge.lease.tenant.fullName}
                    </DeferredLink>
                  </td>
                  <td className="px-4 py-3">
                    <DeferredLink
                      href={`/dashboard/org/properties/${encodePublicId(charge.lease.unit.property.id, "property")}`}
                      className="font-medium text-foreground transition hover:text-primary"
                    >
                      {charge.lease.unit.property.name}
                    </DeferredLink>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {charge.lease.unit.building?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {charge.lease.unit.houseNo}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {formatCurrency(charge.amountDue)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatCurrency(charge.amountPaid)}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {formatCurrency(charge.balance)}
                  </td>
                  <td className="px-4 py-3">
                    <ChargeStatusPill status={charge.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(charge.dueDate)}
                  </td>
                  <td className="px-4 py-3">
                    <DeferredLink
                      href={`/dashboard/org/leases/${encodePublicId(charge.lease.id, "lease")}`}
                      className="text-sm font-medium text-primary transition hover:text-primary/80"
                    >
                      View lease
                    </DeferredLink>
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
