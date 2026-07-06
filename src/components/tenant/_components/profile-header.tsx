"use client";

import Image from "next/image";
import Link from "next/link";
import { memo } from "react";
import { PencilLine, ShieldCheck, UserCircle2 } from "lucide-react";
import { statusBadgeStyles } from "../_lib/helpers";
import type { TenantProfileViewModel } from "../_lib/types";
import { TopSummaryCard } from "./top-summary-card";

export const ProfileHeader = memo(function ProfileHeader({
  tenant,
  initials,
  tenantTypeLabel,
  statusLabel,
  phoneValue,
  emailValue,
  nationalIdValue,
  kraPinValue,
}: {
  tenant: TenantProfileViewModel;
  initials: string;
  tenantTypeLabel: string;
  statusLabel: string;
  phoneValue: string;
  emailValue: string;
  nationalIdValue: string;
  kraPinValue: string;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
      <div className="px-5 pb-5 pt-6 sm:px-6 lg:px-8 lg:pt-8">
        <div className="flex flex-col items-center text-center lg:flex-row lg:items-center lg:justify-between lg:text-left">
          <div className="flex flex-col items-center lg:flex-row lg:items-center lg:gap-5">
            <div className="relative h-24 w-24 overflow-hidden rounded-[28px] bg-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,0.08)] ring-4 ring-white">
              {tenant.profileImageUrl ? (
                <Image
                  src={tenant.profileImageUrl}
                  alt={`${tenant.fullName} profile photo`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-100 text-2xl font-semibold text-neutral-800">
                  {initials}
                </div>
              )}
            </div>

            <div className="mt-4 lg:mt-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                <UserCircle2 className="h-3.5 w-3.5" />
                Tenant account
              </div>

              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-[30px]">
                {tenant.fullName}
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                {tenantTypeLabel}
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusBadgeStyles(
                    tenant.status,
                  )}`}
                >
                  {statusLabel}
                </span>

                <span className="inline-flex items-center rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  Verified profile
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 hidden lg:block">
            <Link
              href="/dashboard/tenant/profile/edit"
              className="inline-flex items-center gap-2 rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              <PencilLine className="h-4 w-4" />
              Edit Profile
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <TopSummaryCard label="Phone" value={phoneValue} />
          <TopSummaryCard label="Email" value={emailValue} />
          <TopSummaryCard label="National ID" value={nationalIdValue} />
          <TopSummaryCard label="KRA PIN" value={kraPinValue} />
        </div>
      </div>
    </section>
  );
});