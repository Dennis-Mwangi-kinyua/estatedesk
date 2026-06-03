"use client";

import { useActionState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import {
  changeInitialPasswordAction,
  type ChangePasswordState,
} from "./actions";

const initialState: ChangePasswordState = { error: null };

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
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-neutral-700">
              Temporary password
            </span>
            <div className="flex h-12 items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 focus-within:border-neutral-400 focus-within:ring-4 focus-within:ring-neutral-100">
              <KeyRound className="h-4 w-4 text-neutral-400" />
              <input
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
                required
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-neutral-700">
              New password
            </span>
            <div className="flex h-12 items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 focus-within:border-neutral-400 focus-within:ring-4 focus-within:ring-neutral-100">
              <ShieldCheck className="h-4 w-4 text-neutral-400" />
              <input
                name="newPassword"
                type="password"
                minLength={8}
                autoComplete="new-password"
                className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
                required
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-neutral-700">
              Confirm new password
            </span>
            <div className="flex h-12 items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 focus-within:border-neutral-400 focus-within:ring-4 focus-within:ring-neutral-100">
              <ShieldCheck className="h-4 w-4 text-neutral-400" />
              <input
                name="confirmPassword"
                type="password"
                minLength={8}
                autoComplete="new-password"
                className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
                required
              />
            </div>
          </label>
        </>
      ) : null}

      <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <input
          name="acceptedTerms"
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-neutral-300"
          required
        />
        <span className="text-sm leading-6 text-neutral-700">
          I accept the EstateDesk terms of use, agree to use only authorized
          records, and understand that system activity may be logged for
          security and accountability.
        </span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="ios-button inline-flex h-12 w-full items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
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
