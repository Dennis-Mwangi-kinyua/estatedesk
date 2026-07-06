"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "../../../_components/control-plane";
import { steps } from "../_lib/constants";
import { NewOrgStepAdmin } from "./new-org-step-admin";
import { NewOrgStepOrganization } from "./new-org-step-organization";
import { NewOrgStepReview } from "./new-org-step-review";
import type { CreateOrganizationState } from "../actions";
import { useNewOrgForm } from "./use-new-org-form";

type CreateOrganizationAction = (
  prevState: CreateOrganizationState,
  formData: FormData,
) => Promise<CreateOrganizationState>;

function getScrollParent(element: HTMLElement | null) {
  let parent = element?.parentElement ?? null;

  while (parent) {
    const style = window.getComputedStyle(parent);
    const scrollableY = /(auto|scroll)/.test(style.overflowY);

    if (scrollableY && parent.scrollHeight > parent.clientHeight) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return null;
}

export function NewOrganizationWorkspace({
  createOrganizationAction,
}: {
  createOrganizationAction: CreateOrganizationAction;
}) {
  const form = useNewOrgForm(createOrganizationAction);
  const footerSentinelRef = useRef<HTMLDivElement>(null);
  const [footerReached, setFooterReached] = useState(false);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);

  const stepReady = useMemo(() => {
    if (form.step === 1) {
      return form.canGoStep2();
    }

    if (form.step === 2) {
      return form.canGoStep3();
    }

    return true;
  }, [form]);

  const showStepNav =
    stepReady && (footerReached || (form.step === 3 && reviewConfirmed));

  useEffect(() => {
    setFooterReached(false);
    setReviewConfirmed(false);
  }, [form.step]);

  useEffect(() => {
    const sentinel = footerSentinelRef.current;

    if (!sentinel) {
      return;
    }

    const scrollRoot = getScrollParent(sentinel);

    const observer = new IntersectionObserver(
      ([entry]) => {
        setFooterReached(entry.isIntersecting);
      },
      {
        root: scrollRoot,
        threshold: 0.6,
      },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [form.step]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Platform / Organizations / New"
        title="Create organization"
        description="Set up a new organization workspace and its master login."
        action={
          <Link
            href="/platform/organizations"
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
              <div
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
                  Step {item.id}
                </div>
                <div className="text-sm font-semibold sm:text-base">
                  {item.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {form.state.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-300">
          {form.state.error}
        </div>
      ) : null}

      <form
        action={form.formAction}
        className="space-y-6"
        onSubmit={(event) => {
          if (form.step !== 3 || !reviewConfirmed) {
            event.preventDefault();
          }
        }}
      >
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

        {form.step === 1 ? <NewOrgStepOrganization {...form} /> : null}
        {form.step === 2 ? <NewOrgStepAdmin {...form} /> : null}
        {form.step === 3 ? (
          <NewOrgStepReview {...form} reviewConfirmed={reviewConfirmed} />
        ) : null}

        <div ref={footerSentinelRef} className="h-px w-full" aria-hidden="true" />

        {showStepNav ? (
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Step {form.step} of {steps.length}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={form.prevStep}
                  disabled={form.step === 1 || form.pending}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-100 dark:hover:bg-white/10 sm:flex-none"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>

                {form.step < 3 ? (
                  <button
                    type="button"
                    onClick={form.nextStep}
                    disabled={
                      form.pending ||
                      (form.step === 1 && !form.canGoStep2()) ||
                      (form.step === 2 && !form.canGoStep3())
                    }
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-[#0f172a] dark:hover:bg-slate-200 sm:flex-none"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : reviewConfirmed ? (
                  <button
                    type="submit"
                    disabled={form.pending}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-[#0f172a] dark:hover:bg-slate-200 sm:flex-none"
                  >
                    {form.pending ? "Creating..." : "Create organization"}
                    {!form.pending ? <CheckCircle2 className="h-4 w-4" /> : null}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setReviewConfirmed(true)}
                    disabled={form.pending}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-[#0f172a] dark:hover:bg-slate-200 sm:flex-none"
                  >
                    I have reviewed these details
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );
}