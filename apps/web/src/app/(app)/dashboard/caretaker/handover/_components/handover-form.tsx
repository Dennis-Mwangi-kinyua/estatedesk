"use client";

import { useActionState, useMemo } from "react";
import { submitCaretakerHandoverAction } from "../actions";
import type { SubmitHandoverState } from "../_lib/types";
import { CaretakerI18nFormat } from "@/app/(app)/dashboard/caretaker/_components/caretaker-i18n-format";
import { CaretakerI18nLabel } from "@/app/(app)/dashboard/caretaker/_components/caretaker-i18n-label";
import { useCaretakerLocale } from "@/app/(app)/dashboard/caretaker/_lib/use-caretaker-locale";
import {
  panelBodyClassName,
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";

const initialState: SubmitHandoverState = {};

const fieldClassName =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-ring/30";

export function HandoverForm({
  prefillNotesByLocale,
  openIssueCount,
  urgentCount,
}: {
  prefillNotesByLocale: { en: string; sw: string };
  openIssueCount: number;
  urgentCount: number;
}) {
  const locale = useCaretakerLocale();
  const [state, formAction, pending] = useActionState(
    submitCaretakerHandoverAction,
    initialState,
  );

  const prefillNotes = useMemo(
    () => prefillNotesByLocale[locale] ?? prefillNotesByLocale.en,
    [locale, prefillNotesByLocale],
  );

  return (
    <section className={panelShellClassName}>
      <SectionIntro
        eyebrow={<CaretakerI18nLabel labelKey="shiftEnd" />}
        title={<CaretakerI18nLabel labelKey="submitHandover" />}
      />
      <form action={formAction} className={`space-y-4 ${panelBodyClassName} pt-0`}>
        {openIssueCount > 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            <CaretakerI18nFormat
              labelKey="handoverOpenIssues"
              values={{
                count: openIssueCount,
                urgent:
                  urgentCount > 0
                    ? locale === "sw"
                      ? `, ikiwa ni ${urgentCount} ya dharura`
                      : `, including ${urgentCount} urgent`
                    : "",
              }}
            />
          </div>
        ) : null}

        <textarea
          key={`${locale}-${prefillNotes.slice(0, 24)}`}
          name="notes"
          rows={10}
          required
          minLength={10}
          maxLength={2000}
          defaultValue={prefillNotes}
          placeholder="Summarize completed work, open issues, tenant follow-ups, and anything the next shift or office should know."
          aria-label="Handover notes"
          className={fieldClassName}
        />

        {state.error ? (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p className="text-sm text-emerald-700 dark:text-emerald-200" role="status">
            {state.success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? (
            <CaretakerI18nLabel labelKey="submitting" />
          ) : (
            <CaretakerI18nLabel labelKey="submitHandoverAction" />
          )}
        </button>
      </form>
    </section>
  );
}