import { SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";

export function EmptyState() {
  return (
    <SurfaceCard className="p-8 text-center">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        Water Bills
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        No water bills found for your account.
      </p>

      <div className="mt-4">
        <InAppGuideLink topic="water" workspace="tenant" />
      </div>
    </SurfaceCard>
  );
}