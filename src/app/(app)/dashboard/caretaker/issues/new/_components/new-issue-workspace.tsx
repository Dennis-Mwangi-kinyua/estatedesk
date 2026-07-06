import Link from "next/link";
import { ArrowLeft, Wrench } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import {
  CaretakerWorkspaceFooter,
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { NewIssueForm } from "./new-issue-form";
import { NewIssueSidebar } from "./new-issue-sidebar";

type UnitPrefill = {
  id: string;
  houseNo: string;
  propertyId: string;
  property: {
    id: string;
    name: string;
  };
  building: {
    id: string;
    name: string;
  } | null;
};

export function NewIssueWorkspace({
  sharedTitle,
  sharedDescription,
  defaultPriority = "MEDIUM",
  unitPrefill = null,
  isEmergencyTemplate = false,
}: {
  sharedTitle: string;
  sharedDescription: string;
  defaultPriority?: string;
  unitPrefill?: UnitPrefill | null;
  isEmergencyTemplate?: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6">
      <section className={panelShellClassName}>
        <div className={panelBodyClassName}>
          <Link
            href="/dashboard/caretaker/issues"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to issues
          </Link>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <Wrench className="h-3.5 w-3.5" />
            Field operations
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Report new issue
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
            Create a maintenance issue for your assigned property or unit.
          </p>

          {isEmergencyTemplate ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
              Emergency template applied. Review the details and add a photo if
              available before submitting.
            </div>
          ) : null}

          <InAppGuideHint topic="caretaker" workspace="caretaker" />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <NewIssueForm
          sharedTitle={sharedTitle}
          sharedDescription={sharedDescription}
          defaultPriority={defaultPriority}
          unitPrefill={unitPrefill}
        />
        <NewIssueSidebar />
      </div>

      <CaretakerWorkspaceFooter note="Maintenance reporting for caretakers in the field" />
    </div>
  );
}