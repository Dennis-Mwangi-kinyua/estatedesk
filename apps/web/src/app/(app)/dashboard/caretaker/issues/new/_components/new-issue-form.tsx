"use client";

import Link from "next/link";
import { useState } from "react";
import { createCaretakerIssueAction } from "@/features/issues/actions/create-caretaker-issue-action";
import {
  isOffline,
  queueOfflineIssue,
} from "@/app/(app)/dashboard/caretaker/_lib/offline-form";
import { CaretakerI18nLabel } from "@/app/(app)/dashboard/caretaker/_components/caretaker-i18n-label";
import { caretakerLabel } from "@/app/(app)/dashboard/caretaker/_lib/i18n";
import { useCaretakerLocale } from "@/app/(app)/dashboard/caretaker/_lib/use-caretaker-locale";
import {
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";

const fieldClassName =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-ring/30";

type UnitPrefill = {
  id: string;
  houseNo: string;
  propertyId: string;
  property: {
    id: string;
    name: string;
  };
  building: {
    id: string;
    name: string;
  } | null;
};

export function NewIssueForm({
  sharedTitle,
  sharedDescription,
  defaultPriority = "MEDIUM",
  unitPrefill = null,
}: {
  sharedTitle: string;
  sharedDescription: string;
  defaultPriority?: string;
  unitPrefill?: UnitPrefill | null;
}) {
  const locale = useCaretakerLocale();
  const [queuedMessage, setQueuedMessage] = useState<string | null>(null);

  const unitLabel = unitPrefill
    ? [
        unitPrefill.property.name,
        unitPrefill.building?.name,
        `Unit ${unitPrefill.houseNo}`,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!isOffline()) {
      return;
    }

    event.preventDefault();
    setQueuedMessage(null);

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const priority = String(formData.get("priority") ?? "MEDIUM") as
      | "LOW"
      | "MEDIUM"
      | "HIGH"
      | "URGENT";
    const photo = formData.get("photo");

    if (title.length < 3 || description.length < 5) {
      setQueuedMessage("Add a title and description before saving offline.");
      return;
    }

    await queueOfflineIssue({
      title,
      description,
      priority,
      unitId: unitPrefill?.id,
      propertyId: unitPrefill?.propertyId,
      photo: photo instanceof File ? photo : null,
    });

    event.currentTarget.reset();
    setQueuedMessage(
      photo instanceof File && photo.size > 0
        ? caretakerLabel(locale, "offlineSavedWithPhoto")
        : caretakerLabel(locale, "offlineSaved"),
    );
  }

  return (
    <section className={panelShellClassName}>
      <SectionIntro
        eyebrow="Maintenance"
        title={<CaretakerI18nLabel labelKey="reportIssue" />}
      />

      <form
        action={createCaretakerIssueAction}
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        className="space-y-5 p-5 sm:p-6"
      >
        {unitPrefill ? (
          <>
            <input type="hidden" name="unitId" value={unitPrefill.id} />
            <input
              type="hidden"
              name="propertyId"
              value={unitPrefill.propertyId}
            />

            <div className="rounded-2xl border border-border bg-muted/10 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <CaretakerI18nLabel labelKey="reportingFor" />
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {unitLabel}
              </p>
            </div>
          </>
        ) : null}

        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium text-foreground">
            <CaretakerI18nLabel labelKey="issueTitle" />
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            minLength={3}
            defaultValue={sharedTitle}
            placeholder="e.g. Leaking pipe"
            className={fieldClassName}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="description"
            className="text-sm font-medium text-foreground"
          >
            <CaretakerI18nLabel labelKey="issueDescription" />
          </label>
          <textarea
            id="description"
            name="description"
            required
            minLength={5}
            rows={5}
            defaultValue={sharedDescription}
            placeholder="Describe the issue..."
            className={fieldClassName}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="priority"
            className="text-sm font-medium text-foreground"
          >
            <CaretakerI18nLabel labelKey="priority" />
          </label>
          <select
            id="priority"
            name="priority"
            defaultValue={defaultPriority}
            className={fieldClassName}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="photo" className="text-sm font-medium text-foreground">
            <CaretakerI18nLabel labelKey="photoEvidence" />
          </label>
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/*"
            className={`${fieldClassName} file:mr-3 file:rounded-xl file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-semibold file:text-primary-foreground`}
          />
          <p className="text-xs leading-5 text-muted-foreground">
            <CaretakerI18nLabel labelKey="photoEvidenceHint" />
          </p>
        </div>

        {queuedMessage ? (
          <div className="rounded-2xl border border-sky-200 bg-sky-50/70 px-4 py-3 text-sm text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100">
            {queuedMessage}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <CaretakerI18nLabel labelKey="submitIssue" />
          </button>

          <Link
            href="/dashboard/caretaker/issues"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
          >
            <CaretakerI18nLabel labelKey="cancel" />
          </Link>
        </div>
      </form>
    </section>
  );
}