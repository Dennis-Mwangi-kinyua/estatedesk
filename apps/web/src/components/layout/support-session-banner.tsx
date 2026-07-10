"use client";

import Link from "next/link";
import { LifeBuoy, Timer } from "lucide-react";
import {
  leaveOrgSupportAccessAction,
  extendOrgSupportAccessAction,
} from "@/app/(app)/platform/support-access/actions";

export type SupportSessionBannerData = {
  orgId: string;
  orgSlug: string;
  orgName: string;
  reason: string;
  expiresAtUnix: number;
};

export function SupportSessionBanner({ session }: { session: SupportSessionBannerData }) {
  const remaining = Math.max(
    0,
    Math.ceil((session.expiresAtUnix - Math.floor(Date.now() / 1000)) / 60),
  );

  return (
    <div className="border-b border-amber-300/60 bg-amber-50 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 lg:px-8">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <LifeBuoy className="h-4 w-4 shrink-0" />
            <span className="truncate">
              Support session · {session.orgName}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-amber-900/90 dark:text-amber-50/90">
            Reason: {session.reason}. You are acting as org ADMIN for this workspace.
            Changes are audit-logged.
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium">
            <Timer className="h-3.5 w-3.5" />
            {remaining > 0 ? `${remaining} min remaining` : "Expired — leave or extend"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/platform/organizations/${session.orgSlug}`}
            className="rounded-lg border border-amber-300 bg-white/80 px-3 py-2 text-xs font-semibold text-amber-950 transition hover:bg-white dark:border-amber-500/40 dark:bg-slate-950/40 dark:text-amber-50"
          >
            Platform org
          </Link>
          <form action={extendOrgSupportAccessAction}>
            <button
              type="submit"
              className="rounded-lg border border-amber-300 bg-white/80 px-3 py-2 text-xs font-semibold text-amber-950 transition hover:bg-white dark:border-amber-500/40 dark:bg-slate-950/40 dark:text-amber-50"
            >
              Extend 2h
            </button>
          </form>
          <form action={leaveOrgSupportAccessAction}>
            <input type="hidden" name="returnTo" value="/platform/support-access" />
            <button
              type="submit"
              className="rounded-lg bg-amber-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-800 dark:bg-amber-200 dark:text-amber-950"
            >
              Leave support
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
