import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Shield,
} from "lucide-react";
import type { getPlatformUserDetails } from "../_lib/queries";
import { MetricCard } from "./user-detail-ui";
import { UserDetailProfile } from "./user-detail-profile";
import { UserDetailSidebar } from "./user-detail-sidebar";

export type UserDetailWorkspaceProps = {
  details: Awaited<ReturnType<typeof getPlatformUserDetails>>;
  notice: ReturnType<typeof import("../_lib/helpers").getNotice>;
};

export function UserDetailWorkspace({ details, notice }: UserDetailWorkspaceProps) {
  const { user, grantedPermissions } = details;

  return (
    <div className="min-w-0 bg-white">
      <div className="border-b border-neutral-200 px-3 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Link
              href="/platform/users"
              className="mb-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Platform Users
            </Link>

            <h1 className="text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
              User Details
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Complete profile, platform access, and organization membership details.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <MetricCard
              label="Memberships"
              value={user.memberships.length}
              icon={<Building2 className="h-4 w-4" />}
            />
            <MetricCard
              label="Permissions"
              value={user.platformPermissions.length}
              icon={<Shield className="h-4 w-4" />}
            />
            <MetricCard
              label="Granted"
              value={grantedPermissions.length}
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
          </div>
        </div>
      </div>

      <div className="px-3 py-4 sm:px-6 sm:py-6">
        {notice ? (
          <div
            className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
              notice.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {notice.message}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <UserDetailProfile details={details} notice={notice} />
          <UserDetailSidebar details={details} />
        </div>
      </div>
    </div>
  );
}
