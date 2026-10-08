"use client";

import { WorkspaceIcon } from "@/components/shared/workspace-icon";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "../../../_components/control-plane";
import { accountFieldLabels } from "../_lib/form-validation";
import { steps } from "../_lib/constants";
import { NewOrgStepAdmin } from "./new-org-step-admin";
import { NewOrgStepOrganization } from "./new-org-step-organization";
import { NewOrgStepReview } from "./new-org-step-review";
import type { CreateOrganizationState } from "../actions";
import { AccountCreated } from "./account-created";
import { useNewOrgForm } from "./use-new-org-form";

type CreateOrganizationAction = (
  prevState: CreateOrganizationState,
  formData: FormData,
) => Promise<CreateOrganizationState>;

export function NewOrganizationWorkspace({
  createOrganizationAction,
  checkAvailability,
  initialValues,
  onboardingRequestId,
}: {
  createOrganizationAction: CreateOrganizationAction;
  initialValues?: Record<string, string>;
  onboardingRequestId?: string;
  checkAvailability: (values: Record<string, string>) => Promise<Record<string, string[]>>;
}) {
  const form = useNewOrgForm(createOrganizationAction, checkAvailability, initialValues, onboardingRequestId ? `organisation-draft:${onboardingRequestId}` : "organisation-draft");
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const heading = contentRef.current?.querySelector<HTMLElement>("h2");
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); heading.scrollIntoView({ block: "nearest" }); }
  }, [form.step]);
  useEffect(() => { if (form.state.error && !form.pending) { errorRef.current?.focus(); errorRef.current?.scrollIntoView({ block: "nearest" }); } }, [form.state.error, form.pending]);
  const [submittedPassword, setSubmittedPassword] = useState("");

  if (form.state.success && form.state.createdAccount) {
    return <AccountCreated account={form.state.createdAccount} temporaryPassword={submittedPassword} />;
  }

  return (
    <div className="space-y-5">
      {onboardingRequestId && <p role="status" className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">Applicant details have been filled in. Check them before creating the organisation. This request will close when creation succeeds.</p>}
      {form.restored && <p role="status" className="text-sm text-muted-foreground">Draft restored. Re-enter the temporary password; passwords are never saved.</p>}
      {form.availabilityNotice && <p role="alert" className="text-sm text-red-600">{form.availabilityNotice}</p>}
      <PageHeader
        eyebrow="Platform / Organizations / New"
        title="Create organisation"
        description="Create an agency or landlord workspace in three steps. Download the login handover after creation."
        action={
          <Link data-workspace-action="true"
            href="/platform/organizations"
            data-confirm={(form.organizationName || form.adminFullName) ? "Leave organisation setup? Your details are saved as a draft; passwords will need to be re-entered." : undefined}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
          >
            Back
          </Link>
        }
      />

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 sm:p-5">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {steps.map((item) => {
            const active = item.id === form.step;
            const completed = item.id < form.step;

            return (
              <button data-workspace-action="true"
                type="button"
                disabled={item.id > form.step || (form.pending || form.checking)}
                onClick={() => { setReviewConfirmed(false); form.setStep(item.id); }}
                aria-current={active ? "step" : undefined}
                key={item.id}
                className={`rounded-xl border px-3 py-3 text-center sm:px-4 ${
                  active
                    ? "border-slate-950 bg-slate-100 text-slate-950 dark:border-white/30 dark:bg-white/10 dark:text-white"
                    : completed
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300"
                      : "border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
                }`}
              >
                <div className="mb-1 text-xs font-medium sm:text-sm">
                  <span aria-hidden="true" className="mb-1 block text-2xl"><WorkspaceIcon label={item.id === 1 ? "organisation" : item.id === 2 ? "security" : "tasks"} /></span>Step {item.id}
                </div>
                <div className="text-sm font-semibold sm:text-base">
                  {item.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {(form.state.error || Object.values(form.state.fieldErrors ?? {}).some((errors) => errors?.length)) && (
        <div ref={errorRef} tabIndex={-1} role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-400/30 dark:bg-red-950 dark:text-red-200">
          <p className="font-semibold">{form.state.error || "A few details need attention"}</p>
          <ul className="mt-2 space-y-2">{Object.entries(form.state.fieldErrors ?? {}).filter(([, errors]) => errors?.length).map(([key, errors]) => <li key={key}><button data-workspace-action="true" type="button" onClick={() => { setReviewConfirmed(false); form.setStep(key.startsWith("admin") ? 2 : 1); window.setTimeout(() => contentRef.current?.querySelector<HTMLElement>(`[data-field="${key}"]`)?.focus(), 50); }} className="text-left underline underline-offset-2">{accountFieldLabels[key] ?? key}: {errors?.[0]}</button></li>)}</ul>
        </div>
      )}

      <form
        action={form.formAction}
        className="space-y-6"
        onSubmit={(event) => {
          if ((form.pending || form.checking) || form.step !== 3 || !reviewConfirmed) {
            event.preventDefault();
          } else {
            form.captureSubmission();
            setSubmittedPassword(form.adminPassword);
          }
        }}
      >
        <input type="hidden" name="onboardingRequestId" value={onboardingRequestId ?? ""} />
        <input type="hidden" name="organizationName" value={form.organizationName} />
        <input type="hidden" name="organizationSlug" value={form.organizationSlug} />
        <input type="hidden" name="organizationEmail" value={form.organizationEmail} />
        <input type="hidden" name="organizationPhone" value={form.organizationPhone} />
        <input
          type="hidden"
          name="organizationAddress"
          value={form.organizationAddress}
        />
        <input type="hidden" name="currencyCode" value={form.currencyCode} />
        <input type="hidden" name="timezone" value={form.timezone} />
        <input
          type="hidden"
          name="dataRetentionDays"
          value={form.dataRetentionDays}
        />
        <input type="hidden" name="plan" value={form.plan} />
        <input type="hidden" name="accountType" value={form.accountType} />
        <input type="hidden" name="adminFullName" value={form.adminFullName} />
        <input type="hidden" name="adminUsername" value={form.adminUsername} />
        <input type="hidden" name="adminEmail" value={form.adminEmail} />
        <input type="hidden" name="adminPhone" value={form.adminPhone} />
        <input type="hidden" name="adminPassword" value={form.adminPassword} />
        <input
          type="hidden"
          name="adminPasswordConfirm"
          value={form.adminPasswordConfirm}
        />

        <fieldset disabled={(form.pending || form.checking)} className="min-w-0"><legend className="sr-only">Account setup — step {form.step}</legend><div ref={contentRef}>
        {form.step === 1 ? <NewOrgStepOrganization {...form} /> : null}
        {form.step === 2 ? <NewOrgStepAdmin {...form} /> : null}
        {form.step === 3 ? (
          <div className="space-y-4"><NewOrgStepReview {...form} reviewConfirmed={reviewConfirmed} />
            <div className="flex flex-wrap gap-3"><button data-workspace-action="true" type="button" onClick={() => { setReviewConfirmed(false); form.setStep(1); }} className="min-h-11 rounded-xl border border-border px-4 py-2 text-sm">Edit workspace details</button><button data-workspace-action="true" type="button" onClick={() => { setReviewConfirmed(false); form.setStep(2); }} className="min-h-11 rounded-xl border border-border px-4 py-2 text-sm">Edit owner login</button></div>
            <label className="flex items-start gap-3 rounded-xl border border-border p-4 text-sm"><input type="checkbox" className="mt-1" checked={reviewConfirmed} onChange={(event) => setReviewConfirmed(event.target.checked)} /><span>I have checked the workspace and owner’s login details. Create this account.</span></label>
          </div>
        ) : null}

        </div></fieldset>
        {(
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Step {form.step} of {steps.length}
              </div>

              <div className="flex gap-3">
                <button data-workspace-action="true"
                  type="button"
                  onClick={() => { setReviewConfirmed(false); form.prevStep(); }}
                  disabled={form.step === 1 || (form.pending || form.checking)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-100 dark:hover:bg-white/10 sm:flex-none"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>

                {form.step < 3 ? (
                  <button data-workspace-action="true"
                    type="button"
                    onClick={() => {
                      const ready = form.step === 1 ? form.canGoStep2() : form.canGoStep3();
                      void form.nextStep().then(() => { window.setTimeout(() => { errorRef.current?.focus(); }, 0); });
                      if (!ready) window.setTimeout(() => { errorRef.current?.focus(); errorRef.current?.scrollIntoView({ block: "nearest" }); }, 0);
                    }}
                    disabled={(form.pending || form.checking)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-[#0f172a] dark:hover:bg-slate-200 sm:flex-none"
                  >
                    {form.checking ? "Checking availability…" : form.step === 1 ? "Continue to owner login" : "Review account"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button data-workspace-action="true" type="submit" disabled={(form.pending || form.checking) || !reviewConfirmed} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none">
                    {(form.pending || form.checking) ? "Creating account…" : "Create account"}<CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}