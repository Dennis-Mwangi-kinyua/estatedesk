import Link from "next/link";

export const dynamic = "force-dynamic";

export default function IssuesPage() {
  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Issues</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            View and manage maintenance and operational issues.
          </p>
        </div>

        <Link
          href="/issues/new"
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          New Issue
        </Link>
      </div>

      <section className="rounded-xl border bg-background shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">Issues</h2>
        </div>

        <div className="p-8 text-sm text-muted-foreground">
          Issues page is set up. Next step is wiring it to the correct Prisma
          model and fields.
        </div>
      </section>
    </div>
  );
}