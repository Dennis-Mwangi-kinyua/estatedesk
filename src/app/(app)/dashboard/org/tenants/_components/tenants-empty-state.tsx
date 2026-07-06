import Link from "next/link";
import { Users } from "lucide-react";

export function TenantsEmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="px-5 py-10 text-center sm:px-6 sm:py-12">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted/30">
        <Users className="h-7 w-7 text-muted-foreground" />
      </div>

      <h2 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
        No tenants found
      </h2>

      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
        {hasSearch
          ? "No tenants match that search or filter. Try another keyword or clear the filters."
          : "There are no tenant records on file yet. Add your first tenant and assign them to a unit with lease terms."}
      </p>

      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/dashboard/org/tenants/new"
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          Create new tenant
        </Link>
        {hasSearch ? (
          <Link
            href="/dashboard/org/tenants"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-5 text-sm font-medium text-foreground transition hover:bg-muted/30"
          >
            Clear search
          </Link>
        ) : (
          <Link
            href="/dashboard/org/leases"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-5 text-sm font-medium text-foreground transition hover:bg-muted/30"
          >
            View leases
          </Link>
        )}
      </div>

      {!hasSearch ? (
        <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-muted/10 p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Step 1
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">Create profile</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Add tenant details, contact information, and next of kin.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/10 p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Step 2
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">Assign unit</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Select a vacant unit and set rent, deposit, and due day.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/10 p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Step 3
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">Track tenancy</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Monitor lease, caretaker, and collection status from this directory.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}