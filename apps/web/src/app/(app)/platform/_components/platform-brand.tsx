import { WorkspaceIcon } from "@/components/shared/workspace-icon";

export function PlatformBrand() {
  return <div className="platform-brand flex min-w-0 items-center gap-3">
    <span aria-hidden="true" className="platform-brand-mark grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-card shadow-sm">
      <WorkspaceIcon label="security" className="h-6 w-6" />
    </span>
    <div className="min-w-0">
      <p className="truncate text-base font-semibold tracking-tight text-foreground">EstateDesk</p>
      <p className="truncate text-xs text-muted-foreground">Super platform workspace</p>
    </div>
  </div>;
}
