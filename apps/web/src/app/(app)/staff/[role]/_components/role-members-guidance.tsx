import Link from "next/link";
import { WorkspaceGuidePanel } from "@/components/help/workspace-guide-panel";
import {
  ROLE_META,
  type StaffRole,
} from "@/features/staff/constants/role-meta";
import { panelShellClassName } from "@/app/(app)/staff/_components/staff-ui";
import { getRoleDirectoryGuidance } from "../_lib/constants";

type RoleMembersGuidanceProps = {
  role: StaffRole;
};

export function RoleMembersGuidance({ role }: RoleMembersGuidanceProps) {
  const meta = ROLE_META[role];
  const guidance = getRoleDirectoryGuidance(role);

  return (
    <WorkspaceGuidePanel
      title={`${meta.label} operations`}
      description={
        role === "CARETAKER"
          ? "Caretakers work from mapped properties and apartments. Keep assignments current so field work stays in scope."
          : `${meta.label} members shape how this part of the organisation runs day to day.`
      }
      triggerClassName={panelShellClassName}
    >
      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">
          {meta.label} operations
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {role === "CARETAKER"
            ? "Caretakers work from mapped properties and apartments. Keep assignments current so field work stays in scope."
            : `${meta.label} members shape how this part of the organisation runs day to day.`}
        </p>

        <div className="mt-4 space-y-3">
          {guidance.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border bg-muted/10 p-3"
            >
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
              <Link
                href={item.href}
                className="mt-3 inline-flex text-sm font-medium text-primary transition hover:text-primary/80"
              >
                {item.actionLabel}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </WorkspaceGuidePanel>
  );
}