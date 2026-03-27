import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ReportsPage() {
  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            View analytics, exports, and operational reports.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Back to Dashboard
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <h2 className="text-base font-semibold">Rent Collection</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Track rent billed, paid, and outstanding balances.
          </p>
        </div>

        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <h2 className="text-base font-semibold">Occupancy</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Review occupied, vacant, and inactive units across properties.
          </p>
        </div>

        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <h2 className="text-base font-semibold">Operations</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Summaries for issues, inspections, and move-out activity.
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-background shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">Reports</h2>
        </div>

        <div className="p-8 text-sm text-muted-foreground">
          Reports page is set up. The next step is wiring specific report cards
          and database queries.
        </div>
      </section>
    </div>
  );
}