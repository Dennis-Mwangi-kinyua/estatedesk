"use client";

import { ShieldAlert } from "lucide-react";
import { usePathname } from "next/navigation";
import { isSuperAdminOnlyPath } from "../_lib/nav";

export function DeveloperSensitiveBanner({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const pathname = usePathname();
  if (!isSuperAdmin || !isSuperAdminOnlyPath(pathname)) return null;

  return (
    <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm leading-6 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50 sm:mb-4 sm:px-4">
      <div className="flex items-start gap-2">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold">Sensitive super-admin tooling</p>
          <p className="mt-0.5 text-amber-900/90 dark:text-amber-50/90">
            Website Control can flip kill switches, run nuclear session tools, and take
            over orgs. All changes are audit-logged.
          </p>
        </div>
      </div>
    </div>
  );
}
