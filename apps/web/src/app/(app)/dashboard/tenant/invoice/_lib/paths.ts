export function tenantInvoiceDownloadPath(
  period: string,
  options?: { view?: boolean; leaseId?: string },
) {
  const query = new URLSearchParams();
  if (options?.view) query.set("view", "1");
  if (options?.leaseId) query.set("lease", options.leaseId);
  return `/dashboard/tenant/invoice/${period}/download${query.size ? `?${query}` : ""}`;
}

export function tenantInvoiceViewPath(period: string, leaseId?: string) {
  const path = `/dashboard/tenant/invoice/${period}/view`;
  return leaseId ? `${path}?lease=${encodeURIComponent(leaseId)}` : path;
}
