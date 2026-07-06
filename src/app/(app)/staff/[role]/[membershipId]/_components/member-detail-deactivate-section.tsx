import { deactivateMembershipAction } from "@/features/staff/actions/deactivate-membership";
import type { MemberDetailWorkspaceProps } from "./member-detail-workspace";
import { panelBodyClassName, panelShellClassName } from "./member-detail-ui";

const inputClassName =
  "h-11 w-full rounded-2xl border border-red-500/20 bg-background px-4 text-sm text-foreground outline-none transition focus:border-red-500/40 focus:ring-4 focus:ring-red-500/10";

export function MemberDetailDeactivateSection({ member }: MemberDetailWorkspaceProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-red-500/20 bg-red-500/5 shadow-sm dark:border-red-900/50 dark:bg-red-950/20">
      <div className={`border-b border-red-500/10 ${panelBodyClassName}`}>
        <h2 className="text-lg font-semibold text-foreground sm:text-xl">
          End employment
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Use this when a staff member leaves or is fired. Their staff access is
          ended, the account can be disabled, and the record moves to the previous
          employees register.
        </p>
      </div>

      <form action={deactivateMembershipAction} className={`grid gap-4 ${panelBodyClassName}`}>
        <input type="hidden" name="membershipId" value={member.id} />

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-foreground">End date</span>
          <input type="date" name="employmentEndedAt" className={inputClassName} />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-foreground">Reason</span>
          <input
            name="exitReason"
            placeholder="Resigned, fired, contract ended..."
            className={inputClassName}
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-foreground">Notes</span>
          <textarea
            name="deactivationNotes"
            rows={3}
            placeholder="Optional register notes"
            className="w-full rounded-2xl border border-red-500/20 bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-red-500/40 focus:ring-4 focus:ring-red-500/10"
          />
        </label>

        <label className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-background/80 p-4 text-sm text-foreground">
          <input
            type="checkbox"
            name="disableLogin"
            defaultChecked
            className="mt-1 h-4 w-4 rounded border-border"
          />
          Disable this user account login too.
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-foreground">
            Type {member.user.fullName} to confirm
          </span>
          <input name="confirmation" className={inputClassName} />
        </label>

        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          Deactivate and move to previous employees
        </button>
      </form>
    </section>
  );
}