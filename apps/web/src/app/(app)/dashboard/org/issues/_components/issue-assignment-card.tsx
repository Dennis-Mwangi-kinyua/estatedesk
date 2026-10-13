import { UserCheck } from "lucide-react";
import { assignCaretakerAction } from "../actions";
import type { CaretakerOption, IssueStatusFilter } from "../_lib/types";

export function IssueAssignmentCard({
  issueId,
  currentPage,
  activeFilter,
  selectedCaretakerId,
  caretakers,
}: {
  issueId: string;
  currentPage: number;
  activeFilter: IssueStatusFilter;
  selectedCaretakerId?: string;
  caretakers: CaretakerOption[];
}) {
  return (
    <div className="w-full min-w-0 rounded-[28px] border border-border bg-muted p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background shadow-sm">
          <UserCheck className="h-5 w-5 text-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Assign caretaker
          </p>
          <p className="text-xs text-muted-foreground">
            Once assigned, the issue moves to progress immediately.
          </p>
        </div>
      </div>

      {caretakers.length > 0 ? (
        <form action={assignCaretakerAction} className="mt-4 space-y-3">
          <input type="hidden" name="issueId" value={issueId} />
          <input type="hidden" name="page" value={String(currentPage)} />
          <input type="hidden" name="filter" value={activeFilter} />

          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Caretaker
            </span>
            <select
              name="caretakerUserId"
              defaultValue={selectedCaretakerId ?? ""}
              className="w-full rounded-[20px] border border-border bg-background px-4 py-3.5 text-sm text-foreground outline-none transition focus:border-primary"
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

          <button data-workspace-action="true"
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-[20px] bg-primary px-4 py-3.5 text-sm font-medium text-primary-foreground"
          >
            Assign and move to progress
          </button>
        </form>
      ) : (
        <div className="mt-4 rounded-[18px] border border-dashed border-border bg-background px-4 py-4 text-sm text-muted-foreground">
          No caretaker users were found in this organization yet.
        </div>
      )}
    </div>
  );
}
