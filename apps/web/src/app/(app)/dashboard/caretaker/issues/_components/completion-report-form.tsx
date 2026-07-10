import { CaretakerI18nLabel } from "@/app/(app)/dashboard/caretaker/_components/caretaker-i18n-label";
import { submitIssueResolutionReportAction } from "@/app/(app)/dashboard/caretaker/issues/actions";

export function CompletionReportForm({ issueId }: { issueId: string }) {
  return (
    <form
      action={submitIssueResolutionReportAction}
      encType="multipart/form-data"
      className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10"
    >
      <input type="hidden" name="issueId" value={issueId} />
      <p className="text-sm font-semibold text-foreground">
        <CaretakerI18nLabel labelKey="submitCompletionReport" />
      </p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        <CaretakerI18nLabel labelKey="completionReportHint" />
      </p>
      <div className="mt-3 grid gap-3">
        <textarea
          id={`completion-summary-${issueId}`}
          name="workSummary"
          rows={3}
          required
          minLength={10}
          aria-label="Work summary"
          placeholder="What was done?"
          className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none transition focus:border-primary/40"
        />
        <input
          name="materialsUsed"
          placeholder="Materials used (optional)"
          className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none transition focus:border-primary/40"
        />
        <textarea
          name="tenantInstructions"
          rows={2}
          placeholder="Tenant instructions or follow-up notes (optional)"
          className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none transition focus:border-primary/40"
        />
        <div>
          <label
            htmlFor={`completion-photo-${issueId}`}
            className="mb-2 block text-sm font-medium text-foreground"
          >
            <CaretakerI18nLabel labelKey="completionPhoto" />
          </label>
          <input
            id={`completion-photo-${issueId}`}
            name="photo"
            type="file"
            accept="image/*"
            className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-semibold file:text-primary-foreground"
          />
        </div>
        <button
          type="submit"
          className="inline-flex w-fit items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          <CaretakerI18nLabel labelKey="submitReportToOffice" />
        </button>
      </div>
    </form>
  );
}