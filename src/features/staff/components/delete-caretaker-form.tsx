"use client";

import { useMemo, useState } from "react";
import { removeCaretakerMembershipAction } from "@/features/staff/actions/remove-caretaker-membership";

type DeleteCaretakerFormProps = {
  caretakerName: string;
  membershipId: string;
};

export function DeleteCaretakerForm({
  caretakerName,
  membershipId,
}: DeleteCaretakerFormProps) {
  const [confirmation, setConfirmation] = useState("");
  const [reason, setReason] = useState("");

  const expected = useMemo(() => {
    return caretakerName.trim() || "DELETE";
  }, [caretakerName]);
  const canSubmit = confirmation.trim() === expected;

  return (
    <form
      action={removeCaretakerMembershipAction}
      className="rounded-2xl border border-red-200 bg-red-50 p-4"
    >
      <input type="hidden" name="membershipId" value={membershipId} />

      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-red-950">
            Delete caretaker
          </p>
          <p className="mt-1 text-sm leading-6 text-red-800">
            This removes the caretaker role, ends active allocations, and clears
            caretaker links from leases. Type{" "}
            <span className="font-semibold">{expected}</span> to continue.
          </p>
        </div>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-red-700">
            Confirmation
          </span>
          <input
            name="confirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={expected}
            className="mt-2 h-11 w-full rounded-xl border border-red-200 bg-white px-3 text-sm font-medium text-red-950 outline-none transition placeholder:text-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-red-700">
            Reason
          </span>
          <textarea
            name="reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Why is this caretaker being removed?"
            rows={3}
            className="mt-2 w-full resize-none rounded-xl border border-red-200 bg-white px-3 py-3 text-sm text-red-950 outline-none transition placeholder:text-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
          />
        </label>

        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-200 disabled:text-red-500 sm:w-auto"
        >
          Delete caretaker
        </button>
      </div>
    </form>
  );
}
