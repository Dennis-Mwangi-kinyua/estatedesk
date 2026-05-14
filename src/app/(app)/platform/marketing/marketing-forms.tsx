"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createMarketerAction,
  updateLeadAttributionAction,
  updateMarketerAction,
  updateOrganizationAttributionAction,
  type MarketingActionState,
} from "./actions";

const commissionStatuses = ["PENDING", "APPROVED", "PAID", "CANCELLED"] as const;
const initialMarketingActionState: MarketingActionState = {
  ok: false,
  message: "",
};

type MarketerOption = {
  id: string;
  fullName: string;
  referralCode: string;
};

type MarketerUpdateFormProps = {
  marketerId: string;
  defaultCommissionRate: number;
  status: string;
  notes: string;
};

type AttributionFormProps = {
  kind: "lead" | "organization";
  hiddenName: "requestId" | "orgId";
  hiddenValue: string;
  marketers: MarketerOption[];
  selectedMarketerId: string | null;
  commissionRate: number | null;
  commissionStatus: string;
  commissionNotes: string | null;
};

function SubmitButton({ label = "Save" }: { label?: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-neutral-950 px-3 py-2 font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
    >
      {pending ? "Saving..." : label}
    </button>
  );
}

function FormMessage({ state }: { state: MarketingActionState }) {
  if (!state.message) return null;

  return (
    <p
      className={`text-xs font-medium ${
        state.ok ? "text-emerald-700" : "text-red-700"
      }`}
    >
      {state.message}
    </p>
  );
}

export function CreateMarketerForm() {
  const [state, action] = useActionState(
    createMarketerAction,
    initialMarketingActionState,
  );

  return (
    <form
      action={action}
      className="grid gap-3 p-4 lg:grid-cols-[1fr_1fr_160px_140px] xl:grid-cols-[1fr_1fr_160px_140px_1fr_auto]"
    >
      <input
        name="fullName"
        required
        placeholder="Marketer name"
        className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none"
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none"
      />
      <input
        name="referralCode"
        required
        placeholder="REFCODE"
        className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold uppercase outline-none"
      />
      <input
        name="defaultCommissionRate"
        type="number"
        min="0"
        max="100"
        step="0.01"
        defaultValue="10"
        aria-label="Default commission rate percentage"
        className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none"
      />
      <input
        name="notes"
        placeholder="Notes"
        className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none"
      />
      <SubmitButton label="Add" />
      <div className="lg:col-span-4 xl:col-span-6">
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function MarketerUpdateForm({
  marketerId,
  defaultCommissionRate,
  status,
  notes,
}: MarketerUpdateFormProps) {
  const [state, action] = useActionState(
    updateMarketerAction,
    initialMarketingActionState,
  );

  return (
    <form action={action} className="flex min-w-[360px] flex-col gap-2">
      <div className="flex gap-2">
        <input type="hidden" name="marketerId" value={marketerId} />
        <input
          name="defaultCommissionRate"
          type="number"
          min="0"
          max="100"
          step="0.01"
          defaultValue={defaultCommissionRate}
          aria-label="Default commission rate percentage"
          className="w-24 rounded-xl border border-neutral-200 bg-white px-3 py-2 outline-none"
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded-xl border border-neutral-200 bg-white px-3 py-2 outline-none"
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
        <input
          name="notes"
          defaultValue={notes}
          placeholder="Notes"
          className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 outline-none"
        />
        <SubmitButton />
      </div>
      <FormMessage state={state} />
    </form>
  );
}

export function AttributionForm({
  kind,
  hiddenName,
  hiddenValue,
  marketers,
  selectedMarketerId,
  commissionRate,
  commissionStatus,
  commissionNotes,
}: AttributionFormProps) {
  const formAction =
    kind === "lead"
      ? updateLeadAttributionAction
      : updateOrganizationAttributionAction;
  const [state, action] = useActionState(
    formAction,
    initialMarketingActionState,
  );

  return (
    <form action={action} className="flex min-w-[520px] flex-col gap-2">
      <div className="flex gap-2">
        <input type="hidden" name={hiddenName} value={hiddenValue} />
        <select
          name="marketerId"
          defaultValue={selectedMarketerId ?? "none"}
          className="rounded-xl border border-neutral-200 bg-white px-3 py-2 outline-none"
        >
          <option value="none">Unassigned</option>
          {marketers.map((marketer) => (
            <option key={marketer.id} value={marketer.id}>
              {marketer.fullName} ({marketer.referralCode})
            </option>
          ))}
        </select>
        <input
          name="commissionRate"
          type="number"
          min="0"
          max="100"
          step="0.01"
          defaultValue={commissionRate ?? ""}
          placeholder="Rate %"
          aria-label="Commission rate percentage"
          className="w-24 rounded-xl border border-neutral-200 bg-white px-3 py-2 outline-none"
        />
        <select
          name="commissionStatus"
          defaultValue={commissionStatus}
          className="rounded-xl border border-neutral-200 bg-white px-3 py-2 outline-none"
        >
          {commissionStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <input
          name="commissionNotes"
          defaultValue={commissionNotes ?? ""}
          placeholder="Commission notes"
          className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 outline-none"
        />
        <SubmitButton />
      </div>
      <FormMessage state={state} />
    </form>
  );
}
