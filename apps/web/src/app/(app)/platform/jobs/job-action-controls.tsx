"use client";

import { useFormStatus } from "react-dom";

type JobActionButtonProps = {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "danger";
  confirmMessage?: string;
};

export function JobActionButton({
  children,
  pendingLabel = "Working...",
  variant = "primary",
  confirmMessage,
}: JobActionButtonProps) {
  const { pending } = useFormStatus();
  const classes =
    variant === "danger"
      ? "border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:bg-red-50 disabled:text-red-400"
      : variant === "secondary"
        ? "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-400"
        : "border-slate-950 bg-slate-950 text-white hover:bg-slate-800 disabled:border-slate-300 disabled:bg-slate-300";

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!confirmMessage || pending) return;
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      className={`inline-flex min-h-11 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition disabled:cursor-not-allowed sm:min-h-9 ${classes}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
