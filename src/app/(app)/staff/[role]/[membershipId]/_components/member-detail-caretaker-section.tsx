import { endCaretakerAssignment } from "@/features/staff/actions/create-caretaker-assignment";
import { formatDate } from "../_lib/helpers";
import type { MemberDetailWorkspaceProps } from "./member-detail-workspace";
import {
  panelBodyClassName,
  panelShellClassName,
  SectionIntro,
  StatusPill,
} from "./member-detail-ui";

export function MemberCaretakerSection({
  member,
  caretakerAssignments,
  normalizedRole,
}: MemberDetailWorkspaceProps) {
  if (normalizedRole !== "CARETAKER") {
    return null;
  }

  return (
    <section className={panelShellClassName}>
      <SectionIntro
        title="Caretaker allocations"
        description="Mapped properties and apartments define this caretaker's operating scope."
      />

      {caretakerAssignments.length === 0 ? (
        <div className={panelBodyClassName}>
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 px-5 py-10 text-center">
            <p className="text-sm font-semibold text-foreground">
              No caretaker allocations found
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This caretaker has not been allocated to any property or
              apartment/block yet.
            </p>
          </div>
        </div>
      ) : (
        <div className={`grid grid-cols-1 gap-4 ${panelBodyClassName}`}>
          {caretakerAssignments.map((assignment) => {
            const apartments = assignment.unit
              ? [assignment.unit]
              : assignment.building
                ? assignment.building.units
                : (assignment.property?.units ?? []);

            const title = assignment.unit
              ? [
                  assignment.unit.property.name,
                  assignment.unit.building?.name,
                  `Unit ${assignment.unit.houseNo}`,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : assignment.building
                ? `${assignment.building.property?.name ?? "Property"} · ${assignment.building.name}`
                : (assignment.property?.name ?? "Property allocation");

            const allocationType = assignment.unit
              ? "Unit allocation"
              : assignment.building
                ? "Apartment/block allocation"
                : "Property allocation";

            return (
              <article
                key={assignment.id}
                className="rounded-2xl border border-border bg-background p-4 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {allocationType}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill variant={assignment.active ? "success" : "muted"}>
                      {assignment.active ? "Active" : "Ended"}
                    </StatusPill>

                    {assignment.active ? (
                      <form action={endCaretakerAssignment}>
                        <input
                          type="hidden"
                          name="assignmentId"
                          value={assignment.id}
                        />
                        <input
                          type="hidden"
                          name="membershipId"
                          value={member.id}
                        />
                        <button
                          type="submit"
                          className="inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-500/15 dark:text-red-300"
                        >
                          End assignment
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border bg-muted/10 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Assigned from
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {formatDate(assignment.assignedAt)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-muted/10 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Ended on
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {formatDate(assignment.endedAt)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-muted/10 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Units in scope
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {apartments.length.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Allocated units
                  </p>

                  {apartments.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {apartments.map((unit) => (
                        <span
                          key={unit.id}
                          className="inline-flex rounded-full border border-border bg-muted/20 px-3 py-1 text-xs font-medium text-foreground"
                        >
                          {unit.houseNo}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      No units found under this allocation.
                    </p>
                  )}
                </div>

                {assignment.notes ? (
                  <div className="mt-4 border-t border-border pt-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Notes
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {assignment.notes}
                    </p>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}