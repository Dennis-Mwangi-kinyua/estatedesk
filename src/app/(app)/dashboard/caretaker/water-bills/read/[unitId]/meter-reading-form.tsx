"use client";

import { useActionState, useState } from "react";
import { submitMeterReading } from "./_lib/submit-meter-reading";
import type { SubmitMeterReadingState } from "./_lib/types";
import {
  isOffline,
  queueOfflineMeterReading,
} from "@/app/(app)/dashboard/caretaker/_lib/offline-form";
import { caretakerLabel } from "@/app/(app)/dashboard/caretaker/_lib/i18n";
import { useCaretakerLocale } from "@/app/(app)/dashboard/caretaker/_lib/use-caretaker-locale";

const initialState: SubmitMeterReadingState = {};

export function MeterReadingForm({
  unitId,
  period,
}: {
  unitId: string;
  period: string;
}) {
  const [state, formAction, pending] = useActionState(
    submitMeterReading,
    initialState,
  );
  const locale = useCaretakerLocale();
  const [queuedMessage, setQueuedMessage] = useState<string | null>(null);

  const fieldClassName =
    "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-ring/30";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!isOffline()) {
      return;
    }

    event.preventDefault();
    setQueuedMessage(null);

    const formData = new FormData(event.currentTarget);
    const prevReading = Number(formData.get("prevReading"));
    const currentReading = Number(formData.get("currentReading"));
    const notes = String(formData.get("notes") ?? "").trim();
    const photo = formData.get("photo");

    if (
      !Number.isInteger(prevReading) ||
      !Number.isInteger(currentReading) ||
      currentReading < prevReading
    ) {
      setQueuedMessage("Enter valid readings before saving offline.");
      return;
    }

    await queueOfflineMeterReading({
      unitId,
      period,
      prevReading,
      currentReading,
      notes: notes || undefined,
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
    <form
      action={formAction}
      onSubmit={handleSubmit}
      encType="multipart/form-data"
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      <input type="hidden" name="unitId" value={unitId} />
      <input type="hidden" name="period" value={period} />

      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Previous reading
        </label>
        <input
          type="number"
          name="prevReading"
          min={0}
          step={1}
          required
          className={fieldClassName}
          placeholder="Enter previous reading"
        />
        {state.fieldErrors?.prevReading ? (
          <p className="mt-2 text-xs text-destructive">
            {state.fieldErrors.prevReading}
          </p>
        ) : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Current reading
        </label>
        <input
          type="number"
          name="currentReading"
          min={0}
          step={1}
          required
          className={fieldClassName}
          placeholder="Enter current reading"
        />
        {state.fieldErrors?.currentReading ? (
          <p className="mt-2 text-xs text-destructive">
            {state.fieldErrors.currentReading}
          </p>
        ) : null}
      </div>

      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-medium text-foreground">
          Meter photo
        </label>
        <input
          type="file"
          name="photo"
          accept="image/*"
          className={`${fieldClassName} file:mr-3 file:rounded-xl file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-semibold file:text-primary-foreground`}
        />
        {state.fieldErrors?.photo ? (
          <p className="mt-2 text-xs text-destructive">{state.fieldErrors.photo}</p>
        ) : null}
      </div>

      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-medium text-foreground">
          Notes
        </label>
        <textarea
          name="notes"
          rows={4}
          className={fieldClassName}
          placeholder="Optional notes for office review"
        />
        {state.fieldErrors?.notes ? (
          <p className="mt-2 text-xs text-destructive">{state.fieldErrors.notes}</p>
        ) : null}
      </div>

      {queuedMessage ? (
        <div className="md:col-span-2 rounded-2xl border border-sky-200 bg-sky-50/70 px-4 py-3 text-sm text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100">
          {queuedMessage}
        </div>
      ) : null}

      {state.error ? (
        <div className="md:col-span-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? "Submitting..." : "Submit for approval"}
        </button>
      </div>
    </form>
  );
}