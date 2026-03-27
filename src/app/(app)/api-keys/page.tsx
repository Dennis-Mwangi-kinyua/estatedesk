import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ApiKeysPage() {
  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">API Keys</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage API keys and access credentials.
          </p>
        </div>

        <Link
          href="/settings"
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Back to Settings
        </Link>
      </div>

      <section className="rounded-xl border bg-background shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">API Keys</h2>
        </div>

        <div className="p-8 text-sm text-muted-foreground">
          API keys page is set up. Next step is wiring it to the correct data
          source.
        </div>
      </section>
    </div>
  );
}