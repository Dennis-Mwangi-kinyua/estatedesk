import { TicketStatus } from "@prisma/client";
import {
  addCaretakerIssueProgressNoteAction,
  startCaretakerIssueAction,
} from "@/app/(app)/dashboard/caretaker/issues/actions";
type IssueActionTarget = {
  id: string;
  status: TicketStatus;
  assignedTo: {
    id: string;
  } | null;
};

export function IssueCardActions({
  issue,
  currentUserId,
}: {
  issue: IssueActionTarget;
  currentUserId: string;
}) {
  const canStart =
    issue.status === TicketStatus.OPEN &&
    (!issue.assignedTo?.id || issue.assignedTo.id === currentUserId);

  const canAddProgress =
    issue.status === TicketStatus.IN_PROGRESS &&
    issue.assignedTo?.id === currentUserId;

  if (!canStart && !canAddProgress) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      {canStart ? (
        <form action={startCaretakerIssueAction}>
          <input type="hidden" name="issueId" value={issue.id} />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Start work
          </button>
        </form>
      ) : null}

      {canAddProgress ? (
        <form
          action={addCaretakerIssueProgressNoteAction}
          className="rounded-2xl border border-border bg-muted/10 p-4"
        >
          <input type="hidden" name="issueId" value={issue.id} />
          <p className="text-sm font-semibold text-foreground">
            Add progress update
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Share field notes for the office without closing the ticket.
          </p>
          <textarea
            name="progressNote"
            rows={3}
            required
            minLength={4}
            placeholder="What did you check, fix, or follow up on?"
            className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none transition focus:border-primary/40"
          />
          <button
            type="submit"
            className="mt-3 inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted/30"
          >
            Save progress note
          </button>
        </form>
      ) : null}
    </div>
  );
}