export function getAuditActivityHref(
  entityType: string,
  entityId: string,
): string | null {
  switch (entityType) {
    case "Payment":
      return "/dashboard/org/payments";
    case "Expenditure":
      return "/dashboard/org/expenditures";
    case "VacancyInquiry":
      return "/dashboard/org/vacancy-inquiries";
    case "MoveOutNotice":
      return "/dashboard/org/move-outs";
    case "AccountingRequest":
      return "/dashboard/org/accounting/requests";
    case "IssueTicket":
      return `/dashboard/org/issues/${entityId}`;
    case "IssueResolutionReport":
      return "/dashboard/org/issues/resolution-reports";
    case "Lease":
      return `/dashboard/org/leases/${entityId}`;
    case "Inspection":
      return `/dashboard/org/inspections/${entityId}`;
    case "Tenant":
      return `/dashboard/org/tenants/${entityId}`;
    case "Property":
      return `/dashboard/org/properties/${entityId}`;
    case "Unit":
      return `/dashboard/org/units/${entityId}`;
    case "TaxCharge":
      return "/dashboard/org/taxes";
    case "Notification":
      return "/dashboard/org/notifications";
    default:
      return null;
  }
}