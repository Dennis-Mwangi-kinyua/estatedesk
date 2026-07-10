export function tenantInvoiceDownloadPath(
  period: string,
  options?: { view?: boolean },
) {
  const path = `/dashboard/tenant/invoice/${period}/download`;
  return options?.view ? `${path}?view=1` : path;
}

export function tenantInvoiceViewPath(period: string) {
  return `/dashboard/tenant/invoice/${period}/view`;
}