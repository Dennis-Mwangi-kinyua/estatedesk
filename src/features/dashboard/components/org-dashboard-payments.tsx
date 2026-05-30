import { Landmark, Receipt } from "lucide-react";
import type { OrgDashboardSummary } from "@/features/dashboard/server/get-org-dashboard-summary";
import {
  MiniStat,
  MpesaLogo,
  SectionCard,
} from "./org-dashboard-shared";

function MpesaCard({
  total,
  success,
  pending,
}: {
  total: number;
  success: number;
  pending: number;
}) {
  return (
    <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm dark:border-emerald-400/30 dark:bg-emerald-500/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-200">M-Pesa Payments</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white">
            {total}
          </p>
          <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-300">
            STK collection activity across the organization
          </p>
        </div>
        <MpesaLogo className="h-11 w-20" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 dark:border-emerald-400/30 dark:bg-slate-900/80">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
            Successful
          </p>
          <p className="mt-1.5 text-xl font-semibold text-neutral-950 dark:text-white">{success}</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-white px-4 py-3 dark:border-amber-400/30 dark:bg-slate-900/80">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
            Pending
          </p>
          <p className="mt-1.5 text-xl font-semibold text-neutral-950 dark:text-white">{pending}</p>
        </div>
      </div>
    </div>
  );
}

export function OrgDashboardPayments({
  data,
}: {
  data: OrgDashboardSummary;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <MpesaCard
        total={data.mpesaPayments}
        success={data.mpesaSuccessfulPayments}
        pending={data.mpesaPendingPayments}
      />

      <SectionCard className="p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
          <Landmark className="h-4 w-4" />
          Payments overview
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <MiniStat
            label="All Payments"
            value={data.totalPayments}
            helper="Every recorded payment"
          />
          <MiniStat
            label="Pending Review"
            value={data.pendingPayments}
            helper="Needs processing or verification"
          />
        </div>

        <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-800/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-slate-950">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-950 dark:text-white">
                Collections workflow
              </h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-300">
                Track M-Pesa, bank, and cash payments from one organized dashboard.
              </p>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
