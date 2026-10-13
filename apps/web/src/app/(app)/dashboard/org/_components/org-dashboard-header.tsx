import { WorkspaceHero } from "@/components/shared/workspace-hero";
import Link from "@/components/navigation/workspace-link";
import type { OrgRole } from "@prisma/client";
import { Lightbulb } from "lucide-react";
import { UserRoundPlus as UserPlus } from "@/components/shared/colored-icons";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import { panelShellClassName } from "./org-dashboard-ui";

export function OrgDashboardHeader({
  organizationName,
  orgRole,
}: {
  organizationName: string;
  orgRole?: OrgRole | null;
}) {
  return (
    <section data-workspace-header className={panelShellClassName}>
      <div>
        <WorkspaceHero kind="org" eyebrow={orgRole === "ADMIN" ? "Organisation overview" : "Your team workspace"} title={organizationName} description="Portfolio health and active work, all in one place." actions={<>
          <Link data-workspace-action="true" href="/dashboard/org/insights" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium"><Lightbulb className="h-4 w-4" />Smart insights</Link>
          {orgRole !== "ACCOUNTANT" && <Link data-workspace-action="true" href="/dashboard/org/tenants/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"><UserPlus className="h-4 w-4" />Add tenant</Link>}
        </>}><InAppGuideHint topic="portfolio" workspace="org" orgRole={orgRole} /></WorkspaceHero>
      </div>
    </section>
  );
}
