"use client";

import type { ReactNode } from "react";
import Link from "@/components/navigation/workspace-link";
import { buildAccountCredentialsMessage } from "@/lib/notifications/account-credentials-message";
import type { CreatedAccountLogin } from "@/lib/notifications/recipient-message";
import { RecipientMessageShare } from "./recipient-message-share";

export function AccountCreatedShare({ credentials, continueHref, continueLabel = "Continue", children }: { credentials: CreatedAccountLogin; continueHref: string; continueLabel?: string; children?: ReactNode }) {
  return <div className="space-y-5">
    <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-6"><h1 className="text-xl font-semibold text-foreground">Account created successfully</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{credentials.fullName}&apos;s account is ready. Share the sign-in details before leaving this page.</p></section>
    <RecipientMessageShare title="Share login details" draft={{ ...credentials, subject: "Your EstateDesk account — sign-in details", message: buildAccountCredentialsMessage(credentials) }} />
    {children}
    <p className="text-xs leading-5 text-muted-foreground">The temporary password is available only for this creation session. It is not included in the page URL.</p>
    <Link href={continueHref} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">{continueLabel}</Link>
  </div>;
}
