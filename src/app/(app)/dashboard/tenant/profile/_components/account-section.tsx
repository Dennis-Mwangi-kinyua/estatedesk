import Link from "next/link";
import { KeyRound, ShieldCheck } from "lucide-react";
import { PushNotificationSettingsPanel } from "@/components/pwa/push-notification-settings-panel";
import type { TenantProfileRecord } from "../_lib/types";
import { panelShellClassName } from "./profile-ui";

export function AccountSection({ tenant }: { tenant: TenantProfileRecord }) {
  const user = tenant.user;

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Security
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
          Account access
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage sign-in credentials and review active sessions.
        </p>
      </div>

      <div className="space-y-0 divide-y divide-border">
        <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm font-medium text-foreground">Password</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {user?.mustChangePassword
                ? "A password change is required before your next sensitive action."
                : "Last updated through your account settings."}
            </p>
          </div>
          <Link
            href="/dashboard/tenant/profile/change-password"
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
          >
            <KeyRound className="h-4 w-4" />
            Update
          </Link>
        </div>

        <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm font-medium text-foreground">Active sessions</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Review devices currently signed in to your tenant account.
            </p>
          </div>
          <Link
            href="/dashboard/security"
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
          >
            <ShieldCheck className="h-4 w-4" />
            Review
          </Link>
        </div>
      </div>

      <div className="border-t border-border px-5 py-4 sm:px-6">
        <PushNotificationSettingsPanel />
      </div>
    </section>
  );
}