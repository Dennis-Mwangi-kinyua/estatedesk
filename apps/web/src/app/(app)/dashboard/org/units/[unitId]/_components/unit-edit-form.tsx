"use client";

import { useActionState } from "react";
import type { UnitDetailsViewData } from "../_lib/types";
import { updateUnitProfileAction, type UnitProfileActionState } from "../unit-profile-actions";

function Field({
  name,
  label,
  type = "text",
  value,
  min,
  step,
}: {
  name: string;
  label: string;
  type?: "text" | "number";
  value: string | number;
  min?: number;
  step?: string;
}) {
  return <label className="block space-y-1.5 text-sm font-medium text-slate-700">
    <span>{label}</span>
    <input name={name} type={type} defaultValue={value} min={min} step={step} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900" />
  </label>;
}

export function UnitEditForm({ unit }: { unit: UnitDetailsViewData["unit"] }) {
  const action = updateUnitProfileAction.bind(null, unit.id);
  const [state, formAction, pending] = useActionState(action, {} as UnitProfileActionState);
  return <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <summary className="cursor-pointer py-1 text-sm font-semibold text-slate-800">Edit unit name, numbering and details</summary>
    <form action={formAction} className="mt-4 space-y-4">
      <p className="text-sm text-slate-600">Changes to this unit’s rent and fees update its listed/default details. Existing leases and charges keep their agreed amounts.</p>
      <input type="hidden" name="expectedUpdatedAt" value={unit.updatedAt.toISOString()} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="houseNo" label="Unit name / number" value={unit.houseNo} />
        <Field name="sequenceNo" label="Sequence number (optional)" type="number" min={0} value={unit.sequenceNo ?? ""} />
        <label className="block space-y-1.5 text-sm font-medium text-slate-700">
          <span>Unit type</span>
          <select name="type" defaultValue={unit.type} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900">
            {["APARTMENT", "BEDSITTER", "SHOP", "OFFICE", "STALL", "WAREHOUSE", "GODOWN", "STUDIO", "SINGLE_ROOM"].map(type => <option key={type} value={type}>{type.replaceAll("_", " ").toLowerCase()}</option>)}
          </select>
        </label>
        <Field name="bedrooms" label="Bedrooms" type="number" min={0} value={unit.bedrooms ?? ""} />
        <Field name="bathrooms" label="Bathrooms" type="number" min={0} value={unit.bathrooms ?? ""} />
        <Field name="roomCount" label="Rooms" type="number" min={0} value={unit.roomCount ?? ""} />
        <Field name="floorArea" label="Floor area (sqm)" type="number" min={0.01} step="any" value={unit.floorArea ?? ""} />
        <Field name="rentAmount" label="Monthly rent" type="number" min={0.01} step="0.01" value={String(unit.rentAmount)} />
        <Field name="depositAmount" label="Deposit" type="number" min={0} step="0.01" value={unit.depositAmount === null ? "" : String(unit.depositAmount)} />
        <Field name="serviceCharge" label="Service charge" type="number" min={0} step="0.01" value={unit.serviceCharge === null ? "" : String(unit.serviceCharge)} />
        <Field name="garbageFee" label="Garbage fee" type="number" min={0} step="0.01" value={unit.garbageFee === null ? "" : String(unit.garbageFee)} />
        <Field name="securityFee" label="Security fee" type="number" min={0} step="0.01" value={unit.securityFee === null ? "" : String(unit.securityFee)} />
        <label className="block space-y-1.5 text-sm font-medium text-slate-700">
          <span>Electricity billing</span>
          <select name="electricityBilling" defaultValue={unit.electricityBilling ?? ""} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900">
            <option value="">Not set</option><option value="Prepay">Prepay</option><option value="Postpay">Postpay</option><option value="Included">Included</option>
          </select>
        </label>
      </div>
      <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-slate-700">
        <input name="hasBalcony" type="checkbox" defaultChecked={unit.hasBalcony} />
        Has a balcony
      </label>
      <label className="block space-y-1.5 text-sm font-medium text-slate-700">
        <span>Unit notes</span>
        <textarea name="notes" defaultValue={unit.notes ?? ""} maxLength={5000} rows={4} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-base text-slate-900" />
      </label>
      {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      {state.message && <p role="status" className="text-sm text-emerald-700">{state.message}</p>}
      <button type="submit" disabled={pending} className="min-h-11 rounded-xl bg-slate-900 px-4 font-semibold text-white disabled:opacity-60">
        {pending ? "Saving…" : "Save unit details"}
      </button>
    </form>
  </details>;
}
