import Link from "next/link";
import { getStatusTone } from "@/lib/tenant/tenant-format";

type TenantDashboardHeroProps = {
  fullName: string;
  propertyName?: string | null;
  buildingName?: string | null;
  houseNo?: string | null;
  leaseStatus?: string | null;
};

export function TenantDashboardHero({
  fullName,
  propertyName,
  buildingName,
  houseNo,
  leaseStatus,
}: TenantDashboardHeroProps) {
  return (
    <section className="rounded-[32px] border border-neutral-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-pink-200 bg-pink-50 px-3 py-1.5 text-xs font-medium text-pink-700">
              👋 Welcome
            </span>
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700">
              🏠 Tenant Space
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
              ✨ Live
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
            Hi, {fullName}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600 sm:text-base">
            Everything about your home is in one place — payments, lease details, notices, bills, and requests.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700">
              📍 {propertyName ?? "No property assigned"}
            </span>
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700">
              🧱 {buildingName ?? "No block assigned"}
            </span>
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700">
              🚪 Unit {houseNo ?? "—"}
            </span>
            <span
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${getStatusTone(
                leaseStatus
              )}`}
            >
              📄 Lease {leaseStatus ?? "—"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[340px]">
          <Link
            href="/dashboard/tenant/payments"
            className="inline-flex items-center justify-center rounded-[24px] bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 active:scale-[0.99]"
          >
            💳 View Payments
          </Link>
          <Link
            href="/dashboard/tenant/issues/report"
            className="inline-flex items-center justify-center rounded-[24px] border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50 active:scale-[0.99]"
          >
            🛠️ Report Issue
          </Link>
        </div>
      </div>
    </section>
  );
}