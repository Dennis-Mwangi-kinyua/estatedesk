"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { checkTenantStkStatus } from "../_lib/check-stk-status";

export function StkStatusCheck({ paymentId }: { paymentId: string }) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return <div className="mt-4 rounded-xl border border-border p-4">
    <p className="text-sm">Waiting for M-Pesa confirmation. If no prompt appeared, check the request status before sending another one.</p>
    <button type="button" disabled={pending} className="mt-3 min-h-11 rounded-xl border border-border px-4 py-2 text-sm font-semibold" onClick={() => startTransition(async () => {
      try {
        const result = await checkTenantStkStatus(paymentId);
        setMessage(result.message);
        router.refresh();
      } catch (error) {
        if (isRedirectError(error)) throw error;
        setMessage("Could not check M-Pesa status. Please try again shortly.");
      }
    })}>{pending ? "Checking M-Pesa…" : "Check M-Pesa status"}</button>
    {message ? <p role="status" className="mt-3 text-sm">{message}</p> : null}
  </div>;
}
