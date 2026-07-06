export const SENSITIVE_PAGE_RULES = [
  { prefix: "/dashboard/org/tenants", category: "tenant-records" },
  { prefix: "/dashboard/org/payments", category: "org-payments" },
  { prefix: "/dashboard/org/leases", category: "lease-records" },
  { prefix: "/dashboard/org/units", category: "unit-records" },
  { prefix: "/dashboard/org/accounting", category: "accounting" },
  { prefix: "/dashboard/org/expenditures", category: "expenditures" },
  { prefix: "/dashboard/org/taxes", category: "tax-records" },
  { prefix: "/dashboard/org/reports", category: "org-reports" },
  { prefix: "/dashboard/org/vacancy-inquiries", category: "vacancy-inquiries" },
  { prefix: "/dashboard/org/verify-tenant", category: "tenant-verification" },
  { prefix: "/dashboard/org/imports", category: "data-imports" },
  { prefix: "/dashboard/org/settings", category: "org-settings" },
  { prefix: "/dashboard/tenant/payments", category: "tenant-payments" },
  { prefix: "/dashboard/tenant/lease", category: "tenant-lease" },
  { prefix: "/dashboard/tenant/documents", category: "tenant-documents" },
  { prefix: "/dashboard/tenant/invoice", category: "tenant-invoice" },
  { prefix: "/dashboard/tenant/profile", category: "tenant-profile" },
  { prefix: "/dashboard/caretaker/tenants", category: "caretaker-tenants" },
  { prefix: "/dashboard/caretaker/leases", category: "caretaker-leases" },
  { prefix: "/dashboard/caretaker/water-bills", category: "water-bills" },
  { prefix: "/api-keys", category: "org-api-keys" },
  { prefix: "/platform/api-keys", category: "platform-api-keys" },
  { prefix: "/platform/data-management", category: "platform-data-management" },
  { prefix: "/platform/users", category: "platform-users" },
  { prefix: "/platform/organizations", category: "platform-organizations" },
  { prefix: "/sign-lease", category: "lease-signing" },
] as const;

export function getSensitivePageCategory(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "") || "/";

  const match = SENSITIVE_PAGE_RULES.find(
    (rule) => normalized === rule.prefix || normalized.startsWith(`${rule.prefix}/`),
  );

  return match?.category ?? null;
}