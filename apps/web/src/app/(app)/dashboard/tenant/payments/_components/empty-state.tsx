import { SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";

export function EmptyState() {
  return (
    <SurfaceCard className="p-8 text-center">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        My Payments
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        No payment records found for your account.
      </p>

      <div className="mt-4">
        <InAppGuideLink topic="rent" workspace="tenant" />
      </div>
    </SurfaceCard>
  );
}