import Link from "next/link";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage organization, account, and application settings.
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
          <h2 className="text-base font-semibold">Organization</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Update company profile, branding, and business details.
          </p>
        </div>

        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <h2 className="text-base font-semibold">Users & Access</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage staff roles, permissions, and access controls.
          </p>
        </div>

        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <h2 className="text-base font-semibold">Billing & Integrations</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Configure subscriptions, payment methods, and external services.
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-background shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">Settings</h2>
        </div>

        <div className="p-8 text-sm text-muted-foreground">
          Settings page is set up. The next step is wiring each settings section
          to its corresponding forms and data source.
        </div>
      </section>
    </div>
  );
}