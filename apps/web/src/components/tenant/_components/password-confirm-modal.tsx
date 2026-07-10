"use client";

import { memo } from "react";
import { LockKeyhole, X } from "lucide-react";

export const PasswordConfirmModal = memo(function PasswordConfirmModal({
  isOpen,
  isSubmitting,
  password,
  setPassword,
  error,
  fieldLabel,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  isSubmitting: boolean;
  password: string;
  setPassword: (value: string) => void;
  error: string | null;
  fieldLabel: string;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal overlay"
        onClick={onClose}
        className="absolute inset-0 bg-black/35 backdrop-blur-md"
      />

      <div className="relative z-10 w-full max-w-md rounded-[28px] border border-white/40 bg-white/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100 text-foreground/80">
              <LockKeyhole className="h-5 w-5" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-foreground">
              Confirm your password
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Enter your login password to reveal {fieldLabel.toLowerCase()}.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition hover:bg-neutral-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5">
          <label
            htmlFor="tenant-password-confirm"
            className="mb-2 block text-sm font-medium text-foreground/80"
          >
            Login password
          </label>

          <input
            id="tenant-password-confirm"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            className="w-full rounded-2xl border border-neutral-300 bg-card px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
            autoFocus
          />

          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-neutral-300 bg-card px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || password.trim().length === 0}
            className="flex-1 rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Checking..." : "Reveal"}
          </button>
        </div>
      </div>
    </div>
  );
});