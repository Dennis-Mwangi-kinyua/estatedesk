"use client";

import Link from "@/components/navigation/workspace-link";
import { AccountCreatedShare } from "@/components/shared/account-created-share";
import { RecipientMessageShare } from "@/components/shared/recipient-message-share";
import type { ActionState } from "../_lib/types";

export function TenantSuccessView({ state }: { state: ActionState }) {
  if (state.status !== "success" || !state.credentials) return null;
  const { credentials } = state;
  return <div className="org-theme-content mx-auto w-full max-w-3xl space-y-5 px-4 pb-24 pt-4 sm:px-6">
    <AccountCreatedShare credentials={{ ...credentials, fullName: credentials.tenantName, role: "TENANT" }} continueHref="/dashboard/org/tenants" continueLabel="Go to tenants">
      {state.allocationDraft && <RecipientMessageShare draft={state.allocationDraft} title="Share unit allocation" />}
    </AccountCreatedShare>
    <Link href="/dashboard/org/tenants/new" className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground">Create another tenant</Link>
  </div>;
}
