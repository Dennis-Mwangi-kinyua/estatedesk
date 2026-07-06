import { StatCard } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { formatDate } from "@/app/(app)/dashboard/caretaker/water-bills/_lib/helpers";
import type { CaretakerReadingDetailPageData } from "../_lib/types";

export function ReadingDetailStats({
  data,
}: {
  data: Extract<CaretakerReadingDetailPageData, { ok: true }>;
}) {
  const { reading } = data;

  return (
    <>
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Previous reading" value={reading.prevReading} />
        <StatCard label="Current reading" value={reading.currentReading} />
        <StatCard label="Units used" value={reading.unitsUsed} />
      </section>

      <section className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
        <div className="border-b border-border p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Workflow details
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <div className="rounded-2xl border border-border bg-muted/10 p-4">
            <p className="text-sm text-muted-foreground">Period</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {reading.period}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-muted/10 p-4">
            <p className="text-sm text-muted-foreground">Approved at</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatDate(reading.approvedAt)}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-muted/10 p-4">
            <p className="text-sm text-muted-foreground">Created at</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatDate(reading.createdAt)}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-muted/10 p-4">
            <p className="text-sm text-muted-foreground">Updated at</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatDate(reading.updatedAt)}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}