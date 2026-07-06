import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { SurfaceCard } from "@/components/theme/ed-dashboard-shell";

export function EmptyState({ hasUnit }: { hasUnit: boolean }) {
  return (
    <SurfaceCard className="p-8 text-center">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        Maintenance
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {hasUnit
          ? "No maintenance issues found for your current unit."
          : "No active unit found for your tenant account."}
      </p>

      {hasUnit ? (
        <div className="mt-4">
          <InAppGuideLink topic="issues" workspace="tenant" />
        </div>
      ) : null}
    </SurfaceCard>
  );
}
