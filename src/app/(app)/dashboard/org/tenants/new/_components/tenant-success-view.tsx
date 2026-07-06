"use client";

import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import {
  buildAccountCredentialsEmailHref,
  buildAccountCredentialsWhatsAppHref,
} from "@/lib/notifications/account-credentials-message";
import { buttonPrimaryClassName, buttonSecondaryClassName } from "../_lib/constants";
import type { ActionState } from "../_lib/types";
import { InfoCard, panelShellClassName } from "./ui-primitives";

const shareButtonClassName =
  "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition";

export function TenantSuccessView({ state }: { state: ActionState }) {
  if (state.status !== "success" || !state.credentials) {
    return null;
  }

  const { credentials } = state;
  const shareInput = {
    fullName: credentials.tenantName,
    username: credentials.username,
    password: credentials.password,
    role: "TENANT",
    loginUrl: credentials.loginUrl,
  };

  const emailShareHref = buildAccountCredentialsEmailHref(
    shareInput,
    credentials.email,
  );
  const whatsappShareHref = buildAccountCredentialsWhatsAppHref(
    shareInput,
    credentials.phone,
  );

  return (
    <div className="org-theme-content mx-auto w-full max-w-3xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <section className={`${panelShellClassName} overflow-hidden border-emerald-200 dark:border-emerald-800`}>
        <div className="border-b border-emerald-200 bg-emerald-50/70 px-5 py-6 dark:border-emerald-800 dark:bg-emerald-950/30 sm:px-7">
          <div className="inline-flex items-center rounded-full border border-emerald-200 bg-background px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:text-emerald-200">
            Tenant created successfully
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Tenant account is ready
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            The tenant profile, next of kin details, and login account have been
            created successfully. Share the login details below before leaving
            this page.
          </p>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-7 sm:py-7">
          <InfoCard title="Tenant">
            <p className="text-base font-semibold text-foreground">
              {credentials.tenantName}
            </p>
          </InfoCard>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoCard title="Username">
              <p className="break-all font-mono text-base font-semibold text-foreground">
                {credentials.username}
              </p>
            </InfoCard>

            <InfoCard title="Temporary password">
              <p className="break-all font-mono text-base font-semibold text-foreground">
                {credentials.password}
              </p>
            </InfoCard>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            Save these credentials now. The password is only shown once on this
            screen.
          </div>

          <div className="rounded-2xl border border-border bg-muted/10 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-foreground">
              Share login details
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Send the username and temporary password to the tenant via email or
              WhatsApp. The message is pre-filled with their login details.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <a
                href={emailShareHref}
                className={`${shareButtonClassName} border border-border bg-background text-foreground hover:bg-muted/30`}
              >
                <Mail className="h-4 w-4" />
                {credentials.email ? "Share via email" : "Open email draft"}
              </a>

              <a
                href={whatsappShareHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`${shareButtonClassName} border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/20`}
              >
                <MessageCircle className="h-4 w-4" />
                {credentials.phone ? "Share via WhatsApp" : "Open WhatsApp"}
              </a>
            </div>

            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              {credentials.email || credentials.phone
                ? `Pre-filled for ${[credentials.email, credentials.phone].filter(Boolean).join(" and ")}.`
                : "No tenant email or phone was captured, so you can choose the recipient in your email or WhatsApp app."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/dashboard/org/tenants" className={buttonPrimaryClassName}>
              Go to tenants
            </Link>

            <Link href="/dashboard/org/tenants/new" className={buttonSecondaryClassName}>
              Create another tenant
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}