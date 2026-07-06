import Link from "next/link";
import { KeyRound, LogOut, PencilLine, UserRound } from "lucide-react";
import { logoutAction } from "@/features/auth/actions/logout-action";
import { paymentHealthTone, statusTone } from "../_lib/helpers";
import type { TenantProfilePageData } from "../_lib/types";
import { panelShellClassName } from "./profile-ui";

function formatDate(value: Date | null | undefined) {
  if (!value) return "Never";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(value);
}

export function ProfileHeader({
  tenant,
  paymentHealth,
}: Pick<TenantProfilePageData, "tenant" | "paymentHealth">) {
  const user = tenant.user;
  const initials = tenant.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-sm sm:h-16 sm:w-16">
              {initials || "TP"}
            </div>

            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <UserRound className="h-3.5 w-3.5" />
                Profile
              </div>

              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {tenant.fullName}
              </h1>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {tenant.type === "COMPANY" ? "Company tenant" : "Individual tenant"} •{" "}
                Managed by {tenant.org.name}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusTone(
                    tenant.status,
                  )}`}
                >
                  {tenant.status}
                </span>
                {paymentHealth ? (
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${paymentHealthTone(
                      paymentHealth.tone,
                    )}`}
                  >
                    {paymentHealth.paymentStatus}
                  </span>
                ) : null}
                {user?.mustChangePassword ? (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                    Password change required
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row xl:min-w-[220px] xl:flex-col">
            <Link
              href="/dashboard/tenant/profile/edit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <PencilLine className="h-4 w-4" />
              Edit profile
            </Link>
            <Link
              href="/dashboard/tenant/profile/change-password"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              <KeyRound className="h-4 w-4" />
              Change password
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Username
          </p>
          <p className="mt-2 truncate font-mono text-sm font-semibold text-foreground">
            {user?.username ?? "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Tenant since
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {formatDate(tenant.createdAt)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Last login
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {formatDate(user?.lastLoginAt)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Organisation
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {tenant.org.name}
          </p>
        </div>
      </div>
    </section>
  );
}