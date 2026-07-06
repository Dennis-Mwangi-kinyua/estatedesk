import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, KeyRound } from "lucide-react";
import { TenantWorkspace } from "@/components/theme/ed-dashboard-shell";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { panelShellClassName } from "../_components/profile-ui";
import { ChangePasswordForm } from "./_components/change-password-form";

export const dynamic = "force-dynamic";

export default async function TenantChangePasswordPage() {
  const session = await requireTenantAccess();

  if (!session.userId) {
    redirect("/login");
  }

  return (
    <TenantWorkspace className="max-w-2xl">
      <section className={panelShellClassName}>
        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <Link
            href="/dashboard/tenant/profile"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to profile
          </Link>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <KeyRound className="h-3.5 w-3.5" />
            Security
          </div>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Change password
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Choose a strong password that you have not used elsewhere. You will
            stay signed in on this device after updating it.
          </p>
        </div>
      </section>

      <ChangePasswordForm />
    </TenantWorkspace>
  );
}