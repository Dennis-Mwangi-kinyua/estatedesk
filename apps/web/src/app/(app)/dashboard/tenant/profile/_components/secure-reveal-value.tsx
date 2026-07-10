"use client";

import { useState } from "react";
import { verifyTenantPassword } from "../actions";

type SecureRevealValueProps = {
  masked: string;
  value: string;
  emptyLabel?: string;
};

export function SecureRevealValue({
  masked,
  value,
  emptyLabel = "—",
}: SecureRevealValueProps) {
  const [revealed, setRevealed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const hasValue = Boolean(value && value.trim().length > 0);
  const displayValue = hasValue ? (revealed ? value : masked) : emptyLabel;

  async function handleReveal() {
    if (revealed) {
      setRevealed(false);
      setShowPrompt(false);
      setPassword("");
      setError(null);
      return;
    }

    setShowPrompt(true);
    setError(null);
  }

  async function handleConfirm() {
    setIsChecking(true);
    setError(null);

    const result = await verifyTenantPassword(password);

    setIsChecking(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setRevealed(true);
    setShowPrompt(false);
    setPassword("");
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-semibold text-neutral-950">
          {displayValue}
        </p>

        {hasValue ? (
          <button
            type="button"
            onClick={handleReveal}
            className="shrink-0 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700 transition hover:bg-neutral-50 active:scale-[0.98]"
            aria-pressed={revealed}
          >
            {revealed ? "Hide" : "Reveal"}
          </button>
        ) : null}
      </div>

      {showPrompt ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
          <p className="text-xs text-muted-foreground">
            Enter your login password to reveal this field.
          </p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Login password"
            className="mt-2 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400"
          />
          {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setShowPrompt(false);
                setPassword("");
                setError(null);
              }}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isChecking || password.trim().length === 0}
              className="rounded-xl bg-neutral-950 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
            >
              {isChecking ? "Checking..." : "Confirm"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}