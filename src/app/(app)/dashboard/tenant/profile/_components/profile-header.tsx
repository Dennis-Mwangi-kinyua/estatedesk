import { logoutAction } from "@/features/auth/actions/logout-action";
import { HiOutlineArrowLeftOnRectangle } from "react-icons/hi2";
import { paymentHealthTone, statusTone } from "../_lib/helpers";
import type { getTenantProfileData } from "../_lib/queries";

type ProfileHeaderProps = {
  tenant: NonNullable<Awaited<ReturnType<typeof getTenantProfileData>>["tenant"]>;
  paymentHealth: Awaited<ReturnType<typeof getTenantProfileData>>["paymentHealth"];
};

export function ProfileHeader({ tenant, paymentHealth }: ProfileHeaderProps) {
  const initials = tenant.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <section className="overflow-hidden rounded-[26px] border border-neutral-200/80 bg-white/92 p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur sm:rounded-[28px] sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-neutral-950 text-sm font-semibold text-white shadow-sm ring-1 ring-black/5 sm:h-16 sm:w-16 sm:rounded-[20px] sm:text-base">
            {initials || "TP"}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
              Tenant Account
            </p>

            <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {tenant.fullName}
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              {tenant.type === "COMPANY" ? "Company tenant" : "Individual tenant"}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusTone(
                  tenant.status,
                )}`}
              >
                {tenant.status}
              </span>

              <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700">
                Verified profile
              </span>

              {paymentHealth ? (
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${paymentHealthTone(
                    paymentHealth.tone,
                  )}`}
                >
                  {paymentHealth.paymentStatus}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <form action={logoutAction} className="sm:shrink-0">
          <button
            type="submit"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100 active:scale-[0.99] sm:w-auto sm:rounded-[20px]"
          >
            <HiOutlineArrowLeftOnRectangle className="h-5 w-5 shrink-0" />
            <span>Logout</span>
          </button>
        </form>
      </div>
    </section>
  );
}