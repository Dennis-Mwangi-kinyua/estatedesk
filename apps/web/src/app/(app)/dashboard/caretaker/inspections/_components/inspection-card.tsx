import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarDays, ClipboardCheck, Clock3, MapPin, Phone, UserRound } from "lucide-react";
import { encodePublicId } from "@/lib/public-id";
import { badgeClass, formatDate, formatDateTime } from "../_lib/helpers";
import type { CaretakerInspectionsPageData } from "../_lib/queries";

type InspectionCardProps = {
  inspection: CaretakerInspectionsPageData["inspections"][number];
};

export function InspectionCard({ inspection }: InspectionCardProps) {
  const detailHref = `/dashboard/caretaker/inspections/${encodePublicId(inspection.id, "inspection")}`;
  const scheduled = inspection.status === "SCHEDULED";
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:border-primary/30 hover:shadow-md sm:rounded-3xl">
      <div className="p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><UserRound aria-hidden="true" className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <h3 className="break-words text-base font-semibold text-foreground sm:text-lg">{inspection.notice.tenant.fullName}</h3>
                <p className="mt-0.5 break-words text-sm text-muted-foreground">{inspection.notice.lease.unit.property.name}</p>
              </div>
              <span className={`inline-flex shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${badgeClass(inspection.status)}`}>{inspection.status.toLowerCase()}</span>
            </div>

            <div className="mt-5 grid gap-3 rounded-2xl bg-muted/20 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-4">
              <Info icon={<CalendarDays />} label="Inspection" value={formatDateTime(inspection.scheduledAt)} />
              <Info icon={<MapPin />} label="Location" value={[inspection.notice.lease.unit.building?.name, `Unit ${inspection.notice.lease.unit.houseNo}`].filter(Boolean).join(" · ")} />
              <Info icon={<Phone />} label="Tenant phone" value={inspection.notice.tenant.phone || "Not provided"} />
              <Info icon={<Clock3 />} label="Move-out date" value={formatDate(inspection.notice.moveOutDate)} />
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><UserRound aria-hidden="true" className="size-4 shrink-0" /><span>Inspector:</span><span className="break-words font-medium text-foreground">{inspection.inspector.fullName}</span></p>
          </div>

          <div className="grid w-full gap-2 border-t border-border pt-4 sm:grid-cols-2 xl:w-52 xl:shrink-0 xl:grid-cols-1 xl:border-t-0 xl:pt-0">
            <Link data-workspace-action="true" href={detailHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
              {scheduled ? <><ClipboardIcon />Perform inspection</> : "View submitted report"}
            </Link>
            {scheduled ? inspection.notice.tenant.phone ? <a href={`tel:${inspection.notice.tenant.phone}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted/40"><Phone aria-hidden="true" className="size-4" />Call tenant</a> : <span className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-muted/20 px-4 text-sm font-medium text-muted-foreground"><Phone aria-hidden="true" className="size-4" />No phone number</span> : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="flex min-w-0 items-start gap-2.5"><span className="mt-0.5 shrink-0 text-muted-foreground [&>svg]:size-4">{icon}</span><div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-semibold leading-5 text-foreground">{value}</p></div></div>;
}

function ClipboardIcon() {
  return <ClipboardCheck aria-hidden="true" className="size-4" />;
}
