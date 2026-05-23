"use client";

import { Plus, Save } from "lucide-react";
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

function SubmitButton({
  label = "Save",
  icon = "save",
}: {
  label?: string;
  icon?: "plus" | "save";
}) {
  const { pending } = useFormStatus();
  const Icon = icon === "plus" ? Plus : Save;

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400 sm:w-auto"
    >
      <Icon className="h-4 w-4" />
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
      className="grid gap-3 p-3 sm:p-4 md:grid-cols-2 lg:grid-cols-[1fr_1fr_160px_140px] xl:grid-cols-[1fr_1fr_160px_140px_1fr_auto]"
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
      <SubmitButton label="Add" icon="plus" />
      <div className="md:col-span-2 lg:col-span-4 xl:col-span-6">
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
    <form action={action} className="flex w-full flex-col gap-2 lg:min-w-[360px]">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[96px_130px_1fr_auto]">
        <input type="hidden" name="marketerId" value={marketerId} />
        <input
          name="defaultCommissionRate"
          type="number"
          min="0"
          max="100"
          step="0.01"
          defaultValue={defaultCommissionRate}
          aria-label="Default commission rate percentage"
          className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none"
        />
        <select
          name="status"
          defaultValue={status}
          className="h-11 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none"
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
        <input
          name="notes"
          defaultValue={notes}
          placeholder="Notes"
          className="col-span-2 h-11 min-w-0 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none sm:col-span-1"
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
    <form action={action} className="flex w-full flex-col gap-2 lg:min-w-[520px]">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(150px,1fr)_96px_145px_minmax(150px,1fr)_auto]">
        <input type="hidden" name={hiddenName} value={hiddenValue} />
        <select
          name="marketerId"
          defaultValue={selectedMarketerId ?? "none"}
          className="col-span-2 h-11 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none sm:col-span-1"
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
          className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none"
        />
        <select
          name="commissionStatus"
          defaultValue={commissionStatus}
          className="h-11 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none"
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
          className="col-span-2 h-11 min-w-0 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none sm:col-span-1"
        />
        <SubmitButton />
      </div>
      <FormMessage state={state} />
    </form>
  );
}
