"use client";

import Link from "next/link";
import { useActionState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { PasswordField } from "@/components/auth/password-field";
import { SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import {
  updateTenantPasswordAction,
  type ProfileActionState,
} from "../../actions";

const initialState: ProfileActionState = { ok: false };

const fieldShellClassName =
  "flex h-11 items-center gap-3 rounded-2xl border border-border bg-background px-4 text-foreground transition focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/20";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(
    updateTenantPasswordAction,
    initialState,
  );

  return (
    <SurfaceCard className="p-5 sm:p-6">
      <form action={formAction} className="space-y-4">
      {state.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <PasswordField
        label="Current password"
        name="currentPassword"
        autoComplete="current-password"
        required
        icon={KeyRound}
        shellClassName={fieldShellClassName}
        disabled={pending}
        labelClassName="mb-2 block text-sm font-medium text-foreground"
      />

      <PasswordField
        label="New password"
        name="newPassword"
        autoComplete="new-password"
        required
        minLength={8}
        icon={ShieldCheck}
        shellClassName={fieldShellClassName}
        disabled={pending}
        labelClassName="mb-2 block text-sm font-medium text-foreground"
      />

      <PasswordField
        label="Confirm new password"
        name="confirmPassword"
        autoComplete="new-password"
        required
        minLength={8}
        icon={ShieldCheck}
        shellClassName={fieldShellClassName}
        disabled={pending}
        labelClassName="mb-2 block text-sm font-medium text-foreground"
      />

      <p className="text-sm text-muted-foreground">
        Use at least 8 characters. Avoid passwords you use on other sites.
      </p>

      <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <Link
          href="/dashboard/tenant/profile"
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition hover:bg-muted/30"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
        >
          {pending ? "Updating..." : "Update password"}
        </button>
      </div>
      </form>
    </SurfaceCard>
  );
}