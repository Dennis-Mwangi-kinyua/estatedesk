import Link from "next/link";
import { FileSignature } from "lucide-react";
import type { TenantPortalContext } from "@/lib/tenant/get-tenant-portal-context";

type PendingSignatureBannerProps = {
  pendingSignatures: TenantPortalContext["pendingLeaseSignatures"];
};

function formatExpiry(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(value);
}

export function PendingSignatureBanner({
  pendingSignatures,
}: PendingSignatureBannerProps) {
  if (pendingSignatures.length === 0) {
    return null;
  }

  const primary = pendingSignatures[0];

  return (
    <section className="rounded-[26px] border border-amber-200 bg-amber-50 p-4 shadow-sm sm:rounded-[28px] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-white text-amber-700">
            <FileSignature className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-amber-700/80">
              Action required
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-amber-950">
              Lease signature pending
            </h2>
            <p className="mt-1 text-sm text-amber-900/80">
              Review and sign your lease for {primary.propertyName} / Unit{" "}
              {primary.unitName}. Expires {formatExpiry(primary.expiresAt)}.
              {pendingSignatures.length > 1
                ? ` ${pendingSignatures.length - 1} more request${
                    pendingSignatures.length > 2 ? "s" : ""
                  } waiting.`
                : ""}
            </p>
          </div>
        </div>

        <Link
          href={`/dashboard/tenant/lease/signing?signerId=${primary.id}`}
          className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-amber-900 px-4 text-sm font-semibold text-white transition hover:bg-amber-800"
        >
          Review & sign
        </Link>
      </div>
    </section>
  );
}