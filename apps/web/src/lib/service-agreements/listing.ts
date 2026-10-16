import type { DocumentStatus } from "@prisma/client";

export const agreementViews = [
  { key: "current", label: "Current agreements", description: "Awaiting signatures or fully signed", statuses: ["ISSUED", "COMPLETED"] },
  { key: "drafts", label: "Draft agreements", description: "Private drafts ready to review and send", statuses: ["DRAFT"] },
  { key: "signed", label: "Signed agreements", description: "Both parties signed · PDF available", statuses: ["COMPLETED"] },
  { key: "cancelled", label: "Cancelled agreements", description: "Cancelled drafts and signing requests", statuses: ["REVOKED"] },
  { key: "archived", label: "Archived agreements", description: "Expired or replaced agreements", statuses: ["EXPIRED", "SUPERSEDED"] },
  { key: "all", label: "All agreements", description: "Every agreement across all statuses", statuses: [] },
] as const;
export type AgreementView = typeof agreementViews[number]["key"];
export function agreementView(value?: string) {
  return agreementViews.find(view => view.key === value) ?? agreementViews[0];
}
export function agreementListHref(view: AgreementView, filters: {orgId?: string; q?: string; page?: number} = {}) {
  const params = new URLSearchParams({view});
  if (filters.orgId) params.set("orgId",filters.orgId);
  if (filters.q) params.set("q",filters.q);
  if (filters.page && filters.page > 1) params.set("page",String(filters.page));
  return `/platform/agreements?${params}`;
}
export function agreementStatusLabel(status: DocumentStatus, organizationSigned: boolean) {
  if (status === "ISSUED") return organizationSigned ? "Awaiting EstateDesk signature" : "Awaiting organization signature";
  return {DRAFT:"Draft · not sent", COMPLETED:"Signed by both parties", REVOKED:"Cancelled", SUPERSEDED:"Replaced", EXPIRED:"Expired"}[status];
}
export function canCancelAgreement(platform: boolean, status: DocumentStatus) {
  return platform && (status === "DRAFT" || status === "ISSUED");
}
