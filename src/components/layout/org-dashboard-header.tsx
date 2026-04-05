import Link from "next/link";
import { Bell } from "lucide-react";

export function OrgDashboardHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-black/10 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Organization Dashboard
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage operations, staff, payments, and reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/notifications"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white transition hover:bg-neutral-100"
          >
            <Bell className="h-4 w-4" />
          </Link>

          <div className="hidden rounded-2xl border border-black/10 bg-white px-4 py-2 sm:block">
            <p className="text-sm font-medium">Admin User</p>
            <p className="text-xs text-neutral-500">Organization Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}