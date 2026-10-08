import { WorkspaceIcon } from "@/components/shared/workspace-icon";
import Link from "next/link";

export function PropertiesCreatedBanner() {
  return (
    <section className="rounded-3xl border border-green-200 bg-green-50 dark:border-emerald-800 dark:bg-emerald-950/30 px-5 py-4 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-green-900 dark:text-emerald-200">
            <span aria-hidden="true" className="mr-2"><WorkspaceIcon label="success" className="inline-block h-5 w-5 shrink-0 align-middle" /></span>Property created successfully
          </h2>
          <p className="mt-1 text-sm text-green-800 dark:text-emerald-300">
            Your new property is now available for buildings, units, tenants,
            billing, and portfolio reporting.
          </p>
        </div>

        <Link data-workspace-action="true"
          href="/dashboard/org/properties/new"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-green-600 px-4 text-sm font-medium text-white transition hover:bg-green-700"
        >
          Create another
        </Link>
      </div>
    </section>
  );
}