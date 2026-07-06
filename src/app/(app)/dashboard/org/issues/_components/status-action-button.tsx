import type { IssueStatusFilter } from "../_lib/types";
import { updateIssueStatusAction } from "../actions";

export function StatusActionButton({
  issueId,
  currentPage,
  activeFilter,
  status,
  label,
  className,
  notes,
}: {
  issueId: string;
  currentPage: number;
  activeFilter: IssueStatusFilter;
  status: string;
  label: string;
  className: string;
  notes?: boolean;
}) {
  return (
    <form action={updateIssueStatusAction} className={notes ? "space-y-2" : ""}>
      <input type="hidden" name="issueId" value={issueId} />
      <input type="hidden" name="page" value={String(currentPage)} />
      <input type="hidden" name="filter" value={activeFilter} />
      <input type="hidden" name="status" value={status} />
      {notes ? (
        <textarea
          name="resolutionNotes"
          rows={3}
          placeholder="Add a short resolution note for the tenant..."
          className="w-full rounded-[18px] border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
        />
      ) : null}
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}