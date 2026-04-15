import { UserCheck } from "lucide-react";
import { assignCaretakerAction } from "../actions";
import type { CaretakerOption } from "../_lib/types";

export function IssueAssignmentCard({
  issueId,
  currentPage,
  selectedCaretakerId,
  caretakers,
}: {
  issueId: string;
  currentPage: number;
  selectedCaretakerId?: string;
  caretakers: CaretakerOption[];
}) {
  return (
    <div className="w-full max-w-md rounded-[28px] border border-black/5 bg-[#fbfbfd] p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
          <UserCheck className="h-5 w-5 text-neutral-700" />
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-950">
            Assign caretaker
          </p>
          <p className="text-xs text-neutral-500">
            Once assigned, the issue moves to progress immediately.
          </p>
        </div>
      </div>

      {caretakers.length > 0 ? (
        <form action={assignCaretakerAction} className="mt-4 space-y-3">
          <input type="hidden" name="issueId" value={issueId} />
          <input type="hidden" name="page" value={String(currentPage)} />

          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-neutral-500">
              Caretaker
            </span>
            <select
              name="caretakerUserId"
              defaultValue={selectedCaretakerId ?? ""}
              className="w-full rounded-[20px] border border-neutral-200 bg-white px-4 py-3.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
              required
            >
              <option value="" disabled>
                Select caretaker
              </option>
              {caretakers.map((caretaker) => (
                <option key={caretaker.id} value={caretaker.id}>
                  {caretaker.fullName || caretaker.email || "Unnamed caretaker"}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-[20px] bg-neutral-900 px-4 py-3.5 text-sm font-medium text-white"
          >
            Assign and move to progress
          </button>
        </form>
      ) : (
        <div className="mt-4 rounded-[18px] border border-dashed border-neutral-300 bg-white px-4 py-4 text-sm text-neutral-500">
          No caretaker users were found in this organization yet.
        </div>
      )}
    </div>
  );
}