"use client";

import { useActionState } from "react";
import { submitMeterReading, type SubmitMeterReadingState } from "./actions";

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
    initialState
  );

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <input type="hidden" name="unitId" value={unitId} />
      <input type="hidden" name="period" value={period} />

      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          Previous reading
        </label>
        <input
          type="number"
          name="prevReading"
          min={0}
          step={1}
          required
          className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
          placeholder="Enter previous reading"
        />
        {state.fieldErrors?.prevReading ? (
          <p className="mt-2 text-xs text-red-600">
            {state.fieldErrors.prevReading}
          </p>
        ) : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          Current reading
        </label>
        <input
          type="number"
          name="currentReading"
          min={0}
          step={1}
          required
          className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
          placeholder="Enter current reading"
        />
        {state.fieldErrors?.currentReading ? (
          <p className="mt-2 text-xs text-red-600">
            {state.fieldErrors.currentReading}
          </p>
        ) : null}
      </div>

      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          Notes
        </label>
        <textarea
          name="notes"
          rows={4}
          className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
          placeholder="Optional notes for office review"
        />
        {state.fieldErrors?.notes ? (
          <p className="mt-2 text-xs text-red-600">{state.fieldErrors.notes}</p>
        ) : null}
      </div>

      {state.error ? (
        <div className="md:col-span-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
        >
          {pending ? "Submitting..." : "Submit for approval"}
        </button>
      </div>
    </form>
  );
}