import { DeferredLink } from "@/components/navigation/app-links";
import { encodePublicId } from "@/lib/public-id";
import {
  getCaretakerTenantHref,
  getCaretakerUnitHref,
} from "@/app/(app)/dashboard/caretaker/_lib/paths";
import {
  MiniMetric,
  panelBodyClassName,
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { formatDateTime } from "../_lib/helpers";
import type { CaretakerSearchPageData, SearchResultRow } from "../_lib/types";

function ResultsSection({
  title,
  rows,
}: {
  title: string;
  rows: SearchResultRow[];
}) {
  if (rows.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="rounded-full border border-border bg-muted/20 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {rows.length}
        </span>
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <DeferredLink
            key={row.id}
            href={row.href}
            className="block rounded-2xl border border-border bg-muted/10 p-4 transition hover:bg-muted/20"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {row.primary}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {row.secondary}
                </p>
              </div>
              <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold capitalize text-muted-foreground">
                {row.status.replaceAll("_", " ").toLowerCase()}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Updated {formatDateTime(row.date)}
            </p>
          </DeferredLink>
        ))}
      </div>
    </div>
  );
}

export function SearchResults({
  q,
  data,
}: {
  q: string;
  data: CaretakerSearchPageData;
}) {
  if (!data.ok) {
    return null;
  }

  const unitRows: SearchResultRow[] = data.units.map((unit) => ({
    id: unit.id,
    primary: `House ${unit.houseNo}`,
    secondary: [unit.property.name, unit.building?.name].filter(Boolean).join(" · "),
    status: unit.status,
    href: getCaretakerUnitHref(unit.id),
    date: unit.updatedAt,
  }));

  const tenantRows: SearchResultRow[] = data.tenants.map((tenant) => ({
    id: tenant.id,
    primary: tenant.fullName,
    secondary: tenant.phone,
    status: tenant.status,
    href: getCaretakerTenantHref(tenant.id),
    date: tenant.updatedAt,
  }));

  const issueRows: SearchResultRow[] = data.issues.map((issue) => ({
    id: issue.id,
    primary: issue.title,
    secondary: issue.unit
      ? `${issue.unit.property.name} · House ${issue.unit.houseNo}`
      : "No unit linked",
    status: issue.priority,
    href: `/dashboard/caretaker/issues?status=${issue.status}`,
    date: issue.updatedAt,
  }));

  const inspectionRows: SearchResultRow[] = data.inspections.map(
    (inspection) => ({
      id: inspection.id,
      primary: inspection.notice.tenant.fullName,
      secondary: [
        inspection.notice.lease.unit.property.name,
        `House ${inspection.notice.lease.unit.houseNo}`,
      ].join(" · "),
      status: inspection.status,
      href: `/dashboard/caretaker/inspections/${encodePublicId(
        inspection.id,
        "inspection",
      )}`,
      date: inspection.scheduledAt ?? inspection.updatedAt,
    }),
  );

  const totalMatches =
    unitRows.length +
    tenantRows.length +
    issueRows.length +
    inspectionRows.length;

  return (
    <>
      {data.hasQuery ? (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniMetric label="Units" value={String(unitRows.length)} />
          <MiniMetric label="Tenants" value={String(tenantRows.length)} />
          <MiniMetric label="Issues" value={String(issueRows.length)} />
          <MiniMetric
            label="Inspections"
            value={String(inspectionRows.length)}
          />
        </section>
      ) : null}

      <section className={panelShellClassName}>
        <SectionIntro
          eyebrow="Results"
          title={data.hasQuery ? `Matches for “${q}”` : "Start searching"}
          action={
            data.hasQuery ? (
              <span className="rounded-full border border-border bg-muted/20 px-3 py-1 text-xs font-medium text-muted-foreground">
                {totalMatches} total
              </span>
            ) : null
          }
        />

        <div className={`space-y-6 ${panelBodyClassName} pt-0`}>
          {!data.hasQuery ? (
            <p className="text-sm text-muted-foreground">
              Enter at least 2 characters to search units, tenants, issues, and
              inspections in your scope.
            </p>
          ) : totalMatches === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-8 text-center text-sm text-muted-foreground">
              No matches for “{q}”. Try a house number, tenant name, phone, or
              issue title.
            </div>
          ) : (
            <>
              <ResultsSection title="Units" rows={unitRows} />
              <ResultsSection title="Tenants" rows={tenantRows} />
              <ResultsSection title="Issues" rows={issueRows} />
              <ResultsSection title="Inspections" rows={inspectionRows} />
            </>
          )}
        </div>
      </section>
    </>
  );
}