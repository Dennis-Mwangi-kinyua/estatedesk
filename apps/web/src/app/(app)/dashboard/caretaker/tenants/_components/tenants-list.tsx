import { Users } from "lucide-react";
import { ListPagination } from "@/app/(app)/dashboard/caretaker/_components/list-pagination";
import {
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { buildTenantsPageHref } from "../_lib/helpers";
import { ErrorStateCard } from "@/app/(app)/dashboard/caretaker/issues/_components/issues-ui";
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
  } = data;

  return (
    <section className={panelShellClassName}>
      <SectionIntro
        eyebrow="Tenant board"
        title="Assigned tenants"
        action={
          <span className="rounded-full border border-border bg-muted/20 px-3 py-1 text-xs font-medium text-muted-foreground">
            {totalTenants} total
          </span>
        }
      />

      <div className="space-y-4 p-4 sm:p-5">
        {!data.ok ? (
          <ErrorStateCard message={data.errorMessage} />
        ) : tenants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm font-semibold text-foreground">
              No tenants found
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              No tenant lease is linked to your assigned apartments yet.
            </p>
          </div>
        ) : (
          <>
            <TenantMobileList tenants={tenants} />
            <TenantsTable tenants={tenants} />
          </>
        )}
      </div>

      {data.ok ? (
      <div className="border-t border-border p-4 sm:p-5">
        <ListPagination
          currentPage={currentPage}
          totalPages={totalPages}
          showingFrom={showingFrom}
          showingTo={showingTo}
          totalItems={totalTenants}
          buildHref={buildTenantsPageHref}
        />
      </div>
      ) : null}
    </section>
  );
}