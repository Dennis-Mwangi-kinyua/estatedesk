"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ExternalLink, KeyRound, ShieldCheck } from "lucide-react";
import { PasswordField } from "@/components/auth/password-field";
import {
  changeInitialPasswordAction,
  type ChangePasswordState,
} from "./actions";

const initialState: ChangePasswordState = { error: null };

const fieldShellClassName =
  "change-password-field flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 text-slate-950 transition focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-200/80 dark:border-white/12 dark:bg-white/5 dark:text-slate-50 dark:focus-within:border-white/25 dark:focus-within:ring-white/10";

export function ChangePasswordForm({
  requirePasswordChange,
}: {
  requirePasswordChange: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    changeInitialPasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <input
        type="hidden"
        name="requirePasswordChange"
        value={requirePasswordChange ? "yes" : "no"}
      />

      {requirePasswordChange ? (
        <>
          <PasswordField
            label="Temporary password"
            name="currentPassword"
            autoComplete="current-password"
            required
            icon={KeyRound}
            shellClassName={fieldShellClassName}
            disabled={pending}
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
          />
        </>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/12 dark:bg-white/5">
        <div className="flex items-start gap-3">
          <input
            id="acceptedTerms"
            name="acceptedTerms"
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-emerald-600 dark:border-white/20"
            required
          />
          <label
            htmlFor="acceptedTerms"
            className="cursor-pointer text-sm leading-6 text-slate-600 dark:text-slate-300"
          >
            I accept the EstateDesk{" "}
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-950 underline underline-offset-2 hover:text-slate-700 dark:text-white dark:hover:text-slate-200"
            >
              terms of use
            </Link>
            , agree to use only authorized records, and understand that system
            activity may be logged for security and accountability.
          </label>
        </div>

        <div className="mt-3 pl-7">
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-950 underline underline-offset-2 hover:text-slate-700 dark:text-white dark:hover:text-slate-200"
          >
            Read the terms
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
      >
        {pending
          ? "Updating..."
          : requirePasswordChange
            ? "Change password"
            : "Accept and continue"}
      </button>
    </form>
  );
}