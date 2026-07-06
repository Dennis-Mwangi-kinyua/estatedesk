import Link from "next/link";

export function PropertiesCreatedBanner() {
  return (
    <section className="rounded-3xl border border-green-200 bg-green-50 px-5 py-4 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-green-900">
            Property created successfully
          </h2>
          <p className="mt-1 text-sm text-green-800">
            Your new property is now available for buildings, units, tenants,
            billing, and portfolio reporting.
          </p>
        </div>

        <Link
          href="/dashboard/org/properties/new"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-green-600 px-4 text-sm font-medium text-white transition hover:bg-green-700"
        >
          Create another
        </Link>
      </div>
    </section>
  );
}