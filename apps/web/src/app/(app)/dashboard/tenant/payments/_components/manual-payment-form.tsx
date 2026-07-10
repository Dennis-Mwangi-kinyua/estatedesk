import { SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import { submitManualRentMpesaAction } from "@/app/(app)/dashboard/tenant/payments/actions";
import type { TenantPaymentsPageData } from "@/app/(app)/dashboard/tenant/payments/_lib/types";

export function ManualPaymentForm({ data }: { data: TenantPaymentsPageData }) {
  const { activeLease } = data;

  if (!activeLease) {
    return null;
  }

  return (
    <SurfaceCard className="p-5 sm:p-6 lg:p-7">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Manual rent payment
          </p>
          <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-foreground">
            Submit M-Pesa message
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Paste the confirmation message after paying rent. Your organization
            will verify it before a receipt is issued.
          </p>
        </div>

        <form action={submitManualRentMpesaAction} className="space-y-3">
          <div>
            <label
              htmlFor="amount"
              className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            >
              Amount paid
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              min="1"
              step="1"
              defaultValue={Number(activeLease.monthlyRent)}
              className="mt-1 h-11 w-full rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground outline-none transition focus:border-neutral-400"
              required
            />
          </div>

          <div>
            <label
              htmlFor="transactionMessage"
              className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            >
              M-Pesa transaction message
            </label>
            <textarea
              id="transactionMessage"
              name="transactionMessage"
              rows={5}
              placeholder="QAB12CD34E Confirmed. Ksh..."
              className="mt-1 w-full resize-y rounded-lg border border-border bg-card px-3 py-3 text-sm text-foreground outline-none transition focus:border-neutral-400"
              required
            />
          </div>

          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 sm:w-auto"
          >
            Submit for Verification
          </button>
        </form>
      </div>
    </SurfaceCard>
  );
}