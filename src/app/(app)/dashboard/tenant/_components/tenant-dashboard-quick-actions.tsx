import Link from "next/link";

export function TenantDashboardQuickActions() {
  return (
    <div className="rounded-[30px] border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-sm font-medium text-neutral-500">Quick Actions</p>
      <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
        Jump to a section
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <Link href="/dashboard/tenant/payments" className="rounded-[22px] border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800 transition hover:bg-sky-100">
          💳 Payments
        </Link>
        <Link href="/dashboard/tenant/water-bills" className="rounded-[22px] border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100">
          💧 Water Bills
        </Link>
        <Link href="/dashboard/tenant/lease" className="rounded-[22px] border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-800 transition hover:bg-violet-100">
          📄 Lease Details
        </Link>
        <Link href="/dashboard/tenant/issues" className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100">
          🛠️ Issues
        </Link>
        <Link href="/dashboard/tenant/notices" className="rounded-[22px] border border-pink-200 bg-pink-50 px-4 py-3 text-sm font-semibold text-pink-800 transition hover:bg-pink-100">
          📢 Notices
        </Link>
        <Link href="/dashboard/tenant/profile" className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100">
          👤 Profile
        </Link>
      </div>
    </div>
  );
}