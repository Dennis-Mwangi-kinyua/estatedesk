import { QuickLinkCard } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { Building2, Droplets, Wrench } from "lucide-react";

export function TodaySidebar() {
  return (
    <aside className="space-y-4">
      <section className="overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Field shortcuts</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Jump directly to the tools you use most while moving between
          buildings.
        </p>

        <div className="mt-4 space-y-3">
          <QuickLinkCard
            href="/dashboard/caretaker/units"
            title="Unit profiles"
            description="Open any assigned apartment in one view."
            icon={Building2}
          />
          <QuickLinkCard
            href="/dashboard/caretaker/water-bills/read"
            title="Meter readings"
            description="Capture readings for the current billing period."
            icon={Droplets}
          />
          <QuickLinkCard
            href="/dashboard/caretaker/issues/new"
            title="Report issue"
            description="Log maintenance while you are on site."
            icon={Wrench}
          />
        </div>
      </section>
    </aside>
  );
}