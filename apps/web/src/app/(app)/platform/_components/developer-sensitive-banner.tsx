"use client";

import { ShieldAlert } from "lucide-react";
import { usePathname } from "next/navigation";
import { isSuperAdminOnlyPath } from "../_lib/nav";
import { usePlatformMode } from "./platform-mode-context";

export function DeveloperSensitiveBanner({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const pathname = usePathname();
  const { mode } = usePlatformMode();

  if (mode !== "developer") return null;

  const sensitive = isSuperAdminOnlyPath(pathname);

  if (!sensitive && !isSuperAdmin) {
    return (
      <div className="mb-4 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-100">
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            You are in <strong>Developer mode</strong>. Super-admin-only tools (API keys,
            jobs, data, backups) are hidden from platform admins.
          </p>
        </div>
      </div>
    );
  }

  if (!sensitive) {
    return (
      <div className="mb-4 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-100">
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <strong>Developer mode</strong> — engineering and ops tooling. Use the mode
            toggle or <kbd className="rounded border border-violet-300 px-1 text-[11px]">Alt+Shift+A</kbd>{" "}
            to return to Administration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50">
      <div className="flex items-start gap-2">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold">Sensitive super-admin tooling</p>
          <p className="mt-0.5 text-amber-900/90 dark:text-amber-50/90">
            Actions on this page can revoke keys, run jobs, export data, or affect backups.
            All changes are audit-logged.
          </p>
        </div>
      </div>
    </div>
  );
}
