import { SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import { CalendarDays } from "lucide-react";

export function HowInspectionsWork() {
  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
          <CalendarDays className="h-4 w-4 text-foreground/80" />
        </div>
        <div>
          <h2 className="text-[18px] font-semibold tracking-tight text-foreground">
            How inspections work
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            In your schema, inspections are created from move-out notices. That
            means tenants see inspection records only when a move-out notice
            exists and an inspection is attached to it.
          </p>
        </div>
      </div>
    </SurfaceCard>
  );
}