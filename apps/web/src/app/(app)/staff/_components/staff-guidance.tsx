import Link from "next/link";
import { WorkspaceGuidePanel } from "@/components/help/workspace-guide-panel";
import type { OrgRole } from "@prisma/client";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { STAFF_GUIDANCE } from "../_lib/guidance";
import { panelShellClassName } from "./staff-ui";

export function StaffGuidance({ orgRole }: { orgRole?: OrgRole | null }) {
  return (
    <WorkspaceGuidePanel
      title="People operations"
      description="Staff access shapes what each role can see across properties, billing, and maintenance workflows."
      triggerClassName={panelShellClassName}
    >
      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">People operations</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Staff access shapes what each role can see across properties, billing,
          and maintenance workflows.
        </p>

        <div className="mt-4 space-y-3">
          {STAFF_GUIDANCE.map((item) => (
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

      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Staff access guide</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Learn how roles, permissions, and caretaker coverage stay aligned.
        </p>
        <div className="mt-4">
          <InAppGuideLink
            topic="portfolio"
            workspace="org"
            orgRole={orgRole}
            variant="card"
            className="w-full justify-center"
          />
        </div>
      </section>
    </WorkspaceGuidePanel>
  );
}