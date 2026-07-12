"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Droplets, X } from "lucide-react";
import { quickSubmitMeterReading } from "../[unitId]/_lib/quick-submit-meter-reading";
import type { QuickMeterReadingState } from "../[unitId]/_lib/types";
import type { QuickEntryUnit } from "../_lib/types";

const initialState: QuickMeterReadingState = {};

const fieldClassName =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-ring/30";

export function QuickMeterReadingPopup({
  period,
  pendingUnits,
}: {
  period: string;
  pendingUnits: QuickEntryUnit[];
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
  const effectiveUnitId = remainingUnits.some((unit) => unit.id === selectedUnitId)
    ? selectedUnitId
    : (remainingUnits[0]?.id ?? "");
  const activeUnit =
    remainingUnits.find((unit) => unit.id === effectiveUnitId) ??
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
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
      >
        <Droplets className="h-4 w-4" />
        Quick meter entry
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 p-3 backdrop-blur-md sm:items-center sm:justify-center sm:p-6 supports-[backdrop-filter]:bg-black/40">
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-lg rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Meter reading
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                  {activeUnit ? `Unit ${activeUnit.houseNo}` : "All readings done"}
                </h2>
                {activeUnit ? (
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {activeUnit.tenantName} · {activeUnit.propertyName}
                    {activeUnit.buildingName
                      ? ` · ${activeUnit.buildingName}`
                      : ""}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-muted/30"
                aria-label="Close quick meter entry"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {state.success ? (
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
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
              <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-5 text-sm text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
                Every pending unit for {period} has been submitted for
                verification approval.
              </div>
            ) : (
              <form
                key={`${activeUnit.id}-${state.submittedUnitId ?? "initial"}`}
                action={formAction}
                className="mt-5 space-y-4"
              >
                <input type="hidden" name="period" value={period} />

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Unit
                  </label>
                  <select
                    name="unitId"
                    value={effectiveUnitId}
                    onChange={(event) => setSelectedUnitId(event.target.value)}
                    required
                    className={fieldClassName}
                  >
                    {remainingUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        Unit {unit.houseNo} · {unit.tenantName} ·{" "}
                        {unit.propertyName}
                        {unit.buildingName ? ` · ${unit.buildingName}` : ""}
                      </option>
                    ))}
                  </select>
                  {state.fieldErrors?.unitId ? (
                    <p className="mt-2 text-xs text-destructive">
                      {state.fieldErrors.unitId}
                    </p>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border bg-muted/10 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Previous
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {activeUnit.previousReading}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/10 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Tenant
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-foreground">
                      {activeUnit.tenantName}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Current meter reading
                  </label>
                  <input
                    ref={currentReadingRef}
                    type="number"
                    name="currentReading"
                    min={0}
                    step={1}
                    required
                    className={fieldClassName}
                    placeholder="Enter current units"
                  />
                  {state.fieldErrors?.currentReading ? (
                    <p className="mt-2 text-xs text-destructive">
                      {state.fieldErrors.currentReading}
                    </p>
                  ) : null}
                </div>

                <div>
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
                    <p className="mt-2 text-xs text-destructive">
                      {state.fieldErrors.photo}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    className={fieldClassName}
                    placeholder="Optional note for office"
                  />
                  {state.fieldErrors?.notes ? (
                    <p className="mt-2 text-xs text-destructive">
                      {state.fieldErrors.notes}
                    </p>
                  ) : null}
                </div>

                {state.error ? (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {state.error}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    {remainingUnits.length} unit{remainingUnits.length === 1 ? "" : "s"} left for {period}
                  </p>
                  <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
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