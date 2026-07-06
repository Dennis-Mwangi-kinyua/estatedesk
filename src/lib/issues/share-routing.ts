import type { OrgRole } from "@prisma/client";
import { roleHasOrgPermission } from "@/lib/permissions/role-matrix";
import { buildShareTargetQuery } from "@/lib/pwa/share-target";

type ShareInput = {
  title?: string | null;
  text?: string | null;
  url?: string | null;
};

export function buildShareDraftQuery(input: ShareInput) {
  const query = buildShareTargetQuery(input);
  if (!query) {
    return "";
  }

  const params = new URLSearchParams(query.startsWith("?") ? query.slice(1) : query);
  params.set("shared", "1");
  return `?${params.toString()}`;
}

export function canCreateOrgIssue(role: OrgRole | null | undefined) {
  return (
    roleHasOrgPermission(role, "maintenance.manage") &&
    (role === "ADMIN" || role === "MANAGER" || role === "OFFICE")
  );
}

export function resolveShareTargetPath(input: {
  role: OrgRole | null | undefined;
  isAuthenticated: boolean;
  shareInput: ShareInput;
}) {
  const draftQuery = buildShareDraftQuery(input.shareInput);
  const loginNext = `/share${buildShareTargetQuery(input.shareInput)}`;

  if (!input.isAuthenticated) {
    return `/login?next=${encodeURIComponent(loginNext)}`;
  }

  if (input.role === "TENANT") {
    return `/dashboard/tenant/issues/report${draftQuery}`;
  }

  if (input.role === "CARETAKER") {
    return `/dashboard/caretaker/issues/new${draftQuery}`;
  }

  if (canCreateOrgIssue(input.role)) {
    return `/dashboard/org/issues/new${draftQuery}`;
  }

  return `/dashboard${draftQuery}`;
}

export function resolveIssueCreatePath(input: {
  role: OrgRole | null | undefined;
  search?: string;
}) {
  const query = input.search ?? "";

  if (input.role === "TENANT") {
    return `/dashboard/tenant/issues/report${query}`;
  }

  if (input.role === "CARETAKER") {
    return `/dashboard/caretaker/issues/new${query}`;
  }

  if (canCreateOrgIssue(input.role)) {
    return `/dashboard/org/issues/new${query}`;
  }

  return `/dashboard`;
}