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
    <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-700">M-Pesa Payments</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950">
            {total}
          </p>
          <p className="mt-1.5 text-sm text-neutral-600">
            STK collection activity across the organization
          </p>
        </div>
        <MpesaLogo className="h-11 w-20" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
            Successful
          </p>
          <p className="mt-1.5 text-xl font-semibold text-neutral-950">{success}</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-white px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
            Pending
          </p>
          <p className="mt-1.5 text-xl font-semibold text-neutral-950">{pending}</p>
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
        <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
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

        <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-900 text-white">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-950">
                Collections workflow
              </h3>
              <p className="mt-1 text-sm text-neutral-500">
                Track M-Pesa, bank, and cash payments from one organized dashboard.
              </p>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}