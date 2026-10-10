"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { backfillTenantChargesAction } from "../backfill-tenant-charges-action";

export function BackfillChargesButton({ tenantId }: { tenantId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();
  return <div className="space-y-2">
    <p className="text-sm text-muted-foreground">Some initial charges are missing. Create them for tenancies without payment or move-out history; other tenancies require review.</p>
    <button type="button" disabled={pending} className="min-h-11 rounded-xl border border-border px-4 py-2 text-sm font-semibold disabled:opacity-60" onClick={() => startTransition(async () => {
      try { const result = await backfillTenantChargesAction(tenantId); setMessage(result.message); router.refresh(); }
      catch { setMessage("Could not backfill charges. Please try again."); }
    })}>{pending ? "Creating charges…" : "Create missing initial charges"}</button>
    {message ? <p role="status" className="text-sm">{message}</p> : null}
  </div>;
}
