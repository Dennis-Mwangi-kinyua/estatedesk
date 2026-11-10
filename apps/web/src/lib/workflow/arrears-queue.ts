export type ArrearsCharge = {
  id: string;
  tenantId: string;
  dueDate: Date;
};

/** One row per tenant who still has an overdue charge and no reminder this month. Charges must be oldest first. */
export function unremindedTenantArrears<T extends ArrearsCharge>(charges: T[], remindedTenantIds: ReadonlySet<string>) {
  const seen = new Set<string>();
  const items: T[] = [];
  for (const charge of charges) {
    if (remindedTenantIds.has(charge.tenantId) || seen.has(charge.tenantId)) continue;
    seen.add(charge.tenantId);
    items.push(charge);
  }
  return { total: seen.size, items };
}
