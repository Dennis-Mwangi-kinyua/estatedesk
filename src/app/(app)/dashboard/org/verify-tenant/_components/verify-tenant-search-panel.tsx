import type { VerifyTenantPageData } from "../_lib/types";

export function VerifyTenantSearchPanel({
  search,
  canSearch,
  results,
  currentOrgResults,
  otherOrgResults,
  hasResults,
}: {
  search: VerifyTenantPageData["search"];
  canSearch: VerifyTenantPageData["canSearch"];
  results: VerifyTenantPageData["results"];
  currentOrgResults: VerifyTenantPageData["currentOrgResults"];
  otherOrgResults: VerifyTenantPageData["otherOrgResults"];
  hasResults: VerifyTenantPageData["hasResults"];
}) {
  return (
    <>
      <div className="rounded-[28px] ed-theme-card border border-border bg-card/90 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.05)] backdrop-blur">
        <form className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <input
            type="text"
            name="q"
            defaultValue={search}
            placeholder="Search by phone, email, national ID, KRA PIN, or name"
            className="h-12 w-full rounded-2xl border border-border bg-muted/35 px-4 text-sm text-foreground outline-none placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-card"
          />

          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-neutral-950 px-6 text-sm font-medium text-white transition hover:bg-neutral-800 active:scale-[0.99]"
          >
            Verify tenant
          </button>
        </form>

        {search && !canSearch ? (
          <p className="mt-3 text-sm text-amber-700">
            Enter at least 3 characters to verify a tenant.
          </p>
        ) : null}
      </div>

      {canSearch ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[24px] ed-theme-card border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-neutral-400">
              Matches
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {results.length}
            </p>
          </div>
          <div className="rounded-[24px] ed-theme-card border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-neutral-400">
              In this organisation
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {currentOrgResults.length}
            </p>
          </div>
          <div className="rounded-[24px] ed-theme-card border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-neutral-400">
              Other organisations
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {otherOrgResults.length}
            </p>
          </div>
        </div>
      ) : null}

      {!search ? (
        <div className="rounded-[28px] ed-theme-card border border-border bg-card p-8 text-center shadow-sm">
          <p className="text-sm text-neutral-600">
            Start with a phone number, email, national ID, KRA PIN, or tenant
            name.
          </p>
        </div>
      ) : null}

      {canSearch && !hasResults ? (
        <div className="rounded-[28px] ed-theme-card border border-border bg-card p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-foreground">
            No tenant history found.
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            You can create a new tenant record if their details are confirmed.
          </p>
        </div>
      ) : null}
    </>
  );
}