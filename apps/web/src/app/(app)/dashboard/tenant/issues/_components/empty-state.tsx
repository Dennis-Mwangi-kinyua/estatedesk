import Link from "next/link";
import { SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { Plus } from "lucide-react";

export function EmptyState() {
  return (
    <SurfaceCard className="p-8 text-center">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        My Issues
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        No maintenance or issue tickets found for your unit yet.
      </p>

      <div className="mt-4">
        <InAppGuideLink topic="issues" workspace="tenant" />
      </div>

      <div className="mt-5">
        <Link
          href="/dashboard/tenant/issues/report"
          className="inline-flex items-center rounded-[16px] bg-neutral-900 px-4 py-3 text-sm font-medium text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Report Issue
        </Link>
      </div>
    </SurfaceCard>
  );
}