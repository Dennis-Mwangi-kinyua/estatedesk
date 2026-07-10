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

export function getCaretakerTenantHref(tenantId: string) {
  return `/dashboard/caretaker/tenants/${encodePublicId(tenantId, "tenant")}`;
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

