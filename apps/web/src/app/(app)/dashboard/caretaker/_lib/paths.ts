/** Server-only path helpers. Do not import from client components. */
import { encodePublicId } from "@/lib/public-id";
import { CURRENT_PERIOD } from "@/app/(app)/dashboard/caretaker/water-bills/_lib/types";

export function getCaretakerUnitHref(unitId: string) {
  return `/dashboard/caretaker/units/${encodePublicId(unitId, "unit")}`;
}

export function getCaretakerMeterEntryHref(unitId: string, period = CURRENT_PERIOD) {
  return `/dashboard/caretaker/water-bills/read/${encodePublicId(
    unitId,
    "unit",
  )}?period=${period}`;
}

/**
 * Tenant detail URL uses a human slug (e.g. jane-doe), not a DB/public id.
 * Pass `{ slug }` when known; falls back to encoded id only if slug is missing.
 */
export function getCaretakerTenantHref(
  tenant: string | { id: string; slug?: string | null },
) {
  if (typeof tenant === "string") {
    // Legacy call sites that still pass raw id — prefer encoding until migrated.
    return `/dashboard/caretaker/tenants/${encodePublicId(tenant, "tenant")}`;
  }

  const slug = tenant.slug?.trim();
  if (slug) {
    return `/dashboard/caretaker/tenants/${encodeURIComponent(slug)}`;
  }

  return `/dashboard/caretaker/tenants/${encodePublicId(tenant.id, "tenant")}`;
}

export function getCaretakerIssueHref(issueId: string) {
  return `/dashboard/caretaker/issues/${encodePublicId(issueId, "issue")}`;
}

export function getCaretakerNewIssueHref({
  unitId,
  template,
}: {
  unitId?: string;
  template?: "emergency";
} = {}) {
  const params = new URLSearchParams();

  if (unitId) {
    params.set("unitId", encodePublicId(unitId, "unit"));
  }

  if (template === "emergency") {
    params.set("template", "emergency");
  }

  const query = params.toString();
  return `/dashboard/caretaker/issues/new${query ? `?${query}` : ""}`;
}

