import Link from "next/link";
import { Search, Users } from "lucide-react";
import { ListPagination } from "@/app/(app)/dashboard/caretaker/_components/list-pagination";
import {
  ErrorStateCard,
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { buildTenantsPageHref } from "../_lib/helpers";
import type { CaretakerTenantsPageData } from "../_lib/types";
import { TenantMobileList } from "./tenant-mobile-list";
import { TenantsTable } from "./tenants-table";

export function TenantsList({ data }: { data: CaretakerTenantsPageData }) {
  const {
    tenants,
    totalTenants,
    currentPage,
    totalPages,
    showingFrom,
    showingTo,
    query,
  } = data;

  return (
    <section className={panelShellClassName}>
      <SectionIntro
        eyebrow="Directory"
        title={query ? `Results for “${query}”` : "Assigned tenants"}
        action={
          <span className="rounded-full border border-border bg-muted/20 px-3 py-1 text-xs font-medium text-muted-foreground">
            {totalTenants} {totalTenants === 1 ? "tenant" : "tenants"}
          </span>
        }
      />

      <div className="space-y-4 p-4 sm:p-5">
        {!data.ok ? (
          <ErrorStateCard message={data.errorMessage} />
        ) : tenants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
              {query ? (
                <Search className="h-6 w-6 text-muted-foreground" />
              ) : (
                <Users className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <p className="mt-4 text-base font-semibold text-foreground">
              {query ? "No matches found" : "No tenants yet"}
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              {query
                ? `Nothing matched “${query}” in your assignment scope. Try another name, phone, or unit number.`
                : "When leases are linked to apartments you cover, tenants will appear here for quick contact and follow-up."}
            </p>
            {query ? (
              <Link
                href="/dashboard/caretaker/tenants"
                className="mt-5 inline-flex h-10 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
              >
                Clear search
              </Link>
            ) : null}
          </div>
        ) : (
          <>
            <TenantMobileList tenants={tenants} />
            <TenantsTable tenants={tenants} />
          </>
        )}
      </div>

      {data.ok && totalTenants > 0 ? (
        <div className="border-t border-border p-4 sm:p-5">
          <ListPagination
            currentPage={currentPage}
            totalPages={totalPages}
            showingFrom={showingFrom}
            showingTo={showingTo}
            totalItems={totalTenants}
            buildHref={(page) => buildTenantsPageHref(page, query)}
          />
        </div>
      ) : null}
    </section>
  );
}
