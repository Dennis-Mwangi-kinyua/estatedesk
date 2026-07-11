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
      <div className="mb-3 rounded-xl border border-violet-200 bg-violet-50 px-3 py-3 text-sm leading-6 text-violet-900 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-100 sm:mb-4 sm:px-4">
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            You are in <strong>Developer mode</strong> with full site-ops access (orgs,
            users, billing, support, API keys, jobs, data, backups). Only{" "}
            <strong>Website Control</strong> remains super-admin only.
          </p>
        </div>
      </div>
    );
  }

  if (!sensitive) {
    return (
      <div className="mb-3 rounded-xl border border-violet-200 bg-violet-50 px-3 py-3 text-sm leading-6 text-violet-900 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-100 sm:mb-4 sm:px-4">
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <strong>Developer mode</strong> — engineering tools plus site administration
            (orgs, users, billing, support). Use the mode toggle or{" "}
            <kbd className="rounded border border-violet-300 px-1 text-[11px]">
              Alt+Shift+A
            </kbd>{" "}
            for Administration layout.
          </p>
        </div>
      </div>
    );
  }

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
