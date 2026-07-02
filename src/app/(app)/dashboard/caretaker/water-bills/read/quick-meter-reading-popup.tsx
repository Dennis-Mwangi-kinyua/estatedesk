"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Droplets, X } from "lucide-react";
import {
  quickSubmitMeterReading,
  type QuickMeterReadingState,
} from "./[unitId]/actions";

type PendingUnit = {
  id: string;
  houseNo: string;
  propertyName: string;
  buildingName: string | null;
  tenantName: string;
  previousReading: number;
};

const initialState: QuickMeterReadingState = {};

export function QuickMeterReadingPopup({
  period,
  pendingUnits,
}: {
  period: string;
  pendingUnits: PendingUnit[];
}) {
  const [state, formAction, pending] = useActionState(
    quickSubmitMeterReading,
    initialState,
  );
  const [open, setOpen] = useState(pendingUnits.length > 0);
  const [selectedUnitId, setSelectedUnitId] = useState(pendingUnits[0]?.id ?? "");
  const currentReadingRef = useRef<HTMLInputElement>(null);

  const remainingUnits = useMemo(
    () =>
      pendingUnits.filter(
        (unit) => !(state.submittedUnitIds ?? []).includes(unit.id),
      ),
    [pendingUnits, state.submittedUnitIds],
  );
  const activeUnit =
    remainingUnits.find((unit) => unit.id === selectedUnitId) ??
    remainingUnits[0];

  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => currentReadingRef.current?.focus(), 50);
  }, [activeUnit, open]);

  if (pendingUnits.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
      >
        <Droplets className="h-4 w-4" />
        Quick meter entry
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/45 p-3 sm:items-center sm:justify-center sm:p-6">
          <div className="w-full max-w-lg rounded-[24px] bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-neutral-500">Meter reading</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-neutral-900">
                  {activeUnit ? `House ${activeUnit.houseNo}` : "All readings done"}
                </h2>
                {activeUnit ? (
                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    {activeUnit.propertyName} ·{" "}
                    {activeUnit.buildingName ?? "No building"} ·{" "}
                    {activeUnit.tenantName}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition hover:bg-neutral-50"
                aria-label="Close quick meter entry"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {state.success ? (
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">{state.success}</p>
                  {typeof state.previousReading === "number" &&
                  typeof state.unitsUsed === "number" ? (
                    <p className="mt-1 text-xs">
                      Previous {state.previousReading} · Units used{" "}
                      {state.unitsUsed}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {!activeUnit ? (
              <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-5 text-sm text-sky-800">
                Every pending house for {period} has been submitted for
                verification approval.
              </div>
            ) : (
              <form
                key={`${activeUnit.id}-${state.submittedUnitId ?? "initial"}`}
                action={formAction}
                encType="multipart/form-data"
                className="mt-5 space-y-4"
              >
                <input type="hidden" name="period" value={period} />

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">
                    House number
                  </label>
                  <select
                    name="unitId"
                    value={activeUnit.id}
                    onChange={(event) => setSelectedUnitId(event.target.value)}
                    required
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
                  >
                    {remainingUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        House {unit.houseNo} - {unit.propertyName} -{" "}
                        {unit.buildingName ?? "No building"}
                      </option>
                    ))}
                  </select>
                  {state.fieldErrors?.unitId ? (
                    <p className="mt-2 text-xs text-red-600">
                      {state.fieldErrors.unitId}
                    </p>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-neutral-50 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                      Previous
                    </p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900">
                      {activeUnit.previousReading}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-neutral-50 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                      Tenant
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-neutral-900">
                      {activeUnit.tenantName}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">
                    Current meter reading
                  </label>
                  <input
                    ref={currentReadingRef}
                    type="number"
                    name="currentReading"
                    min={0}
                    step={1}
                    required
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
                    placeholder="Enter current units"
                  />
                  {state.fieldErrors?.currentReading ? (
                    <p className="mt-2 text-xs text-red-600">
                      {state.fieldErrors.currentReading}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">
                    Meter photo
                  </label>
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition file:mr-3 file:rounded-xl file:border-0 file:bg-neutral-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white focus:border-neutral-400"
                  />
                  {state.fieldErrors?.photo ? (
                    <p className="mt-2 text-xs text-red-600">
                      {state.fieldErrors.photo}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
                    placeholder="Optional note for office"
                  />
                  {state.fieldErrors?.notes ? (
                    <p className="mt-2 text-xs text-red-600">
                      {state.fieldErrors.notes}
                    </p>
                  ) : null}
                </div>

                {state.error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {state.error}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-neutral-500">
                    {remainingUnits.length} houses left for {period}
                  </p>
                  <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
                  >
                    {pending ? "Submitting..." : "Submit and open next"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
