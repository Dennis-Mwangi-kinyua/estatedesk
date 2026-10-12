import type { OrgPermission } from "./role-matrix";
export const ORG_PERMISSION_LABELS: Record<OrgPermission, string> = {
  "move-outs.arrears.approve": "Approve handover with arrears",
  "finance.requests.review": "Review, approve, and settle finance requests",
  "org.settings.manage": "Manage organisation settings",
  "org.users.manage": "Create and manage staff accounts",
  "org.users.delete": "Deactivate or remove staff accounts",
  "properties.manage": "Manage properties and units",
  "tenants.manage": "Manage tenants",
  "leases.manage": "Manage leases and agreements",
  "payments.manage": "Manage and reconcile payments",
  "payments.verify": "Verify payments and confirm charges",
  "payments.record": "Record payments",
  "reports.view": "View reports",
  "reports.export": "Export reports",
  "maintenance.manage": "Manage maintenance requests",
  "inspections.manage": "Manage inspections",
  "caretaker.fieldwork": "Perform caretaker fieldwork",
};
