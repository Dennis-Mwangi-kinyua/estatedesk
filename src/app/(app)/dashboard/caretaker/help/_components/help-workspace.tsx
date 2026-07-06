import type { ReactNode } from "react";
import { BookOpen } from "lucide-react";
import {
  CaretakerWorkspaceFooter,
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";

export function HelpWorkspace({
  children,
  title = "Workspace help",
  description = "Guides scoped to your caretaker role and assigned properties.",
  note = "In-app guides for caretaker field operations",
}: {
  children: ReactNode;
  title?: string;
  description?: string;
  note?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6">
      <section className={panelShellClassName}>
        <div className={panelBodyClassName}>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            Help centre
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
      </section>

      {children}

      <CaretakerWorkspaceFooter note={note} />
    </div>
  );
}