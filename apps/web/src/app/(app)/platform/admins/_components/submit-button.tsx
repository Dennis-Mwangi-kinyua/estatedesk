"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, pendingLabel, className, disabled = false, title }: {
  children: React.ReactNode;
  pendingLabel: string;
  className: string;
  disabled?: boolean;
  title?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" data-workspace-action="true" disabled={disabled || pending} aria-disabled={disabled || pending} aria-busy={pending} title={title} className={`${className} disabled:cursor-not-allowed disabled:opacity-50`}>
      {pending ? pendingLabel : children}
    </button>
  );
}
