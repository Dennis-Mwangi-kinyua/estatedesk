import {
  getSensitivePageCategory,
  SENSITIVE_PAGE_RULES,
} from "@/lib/audit/sensitive-page-rules";

const ALWAYS_AUDIT_PREFIXES = [
  "/dashboard/org/settings",
  "/dashboard/tenant/invoice",
  "/dashboard/tenant/documents",
  "/dashboard/tenant/lease",
  "/api-keys",
  "/platform/api-keys",
  "/platform/data-management",
  "/sign-lease/",
] as const;

export function shouldAuditSensitivePageView(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const category = getSensitivePageCategory(normalized);

  if (!category) return false;

  if (ALWAYS_AUDIT_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return true;
  }

  return SENSITIVE_PAGE_RULES.some((rule) => {
    if (!normalized.startsWith(rule.prefix)) return false;
    const remainder = normalized.slice(rule.prefix.length);
    return remainder.length > 1;
  });
}