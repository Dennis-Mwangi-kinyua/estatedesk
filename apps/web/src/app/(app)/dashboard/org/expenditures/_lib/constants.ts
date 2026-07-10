export const EXPENDITURE_WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Record the cost",
    description:
      "Capture description, category, amount, date, payee, and payment reference.",
  },
  {
    step: "02",
    title: "Choose scope",
    description:
      "Leave tenant blank for organization costs, or link the spend to a specific tenant.",
  },
  {
    step: "03",
    title: "Post and recover",
    description:
      "Mark paid to post to the ledger, or flag chargeable when the tenant should repay.",
  },
] as const;

export const EXPENDITURE_GUIDANCE = [
  {
    title: "Organization costs",
    description:
      "Property maintenance, utilities, admin, and other operating spend tracked at portfolio level.",
    href: "/dashboard/org/accounting",
    actionLabel: "Open accounting",
  },
  {
    title: "Tenant-linked costs",
    description:
      "Repairs or services tied to one tenant. Use chargeable when the amount should be recovered.",
    href: "/dashboard/org/tenants",
    actionLabel: "View tenants",
  },
  {
    title: "Tenant visibility",
    description:
      "Chargeable tenant expenditures can appear on the tenant portal for transparency.",
    href: "/dashboard/org/payments",
    actionLabel: "Payments desk",
  },
] as const;

export const PAYMENT_METHODS = ["BANK", "CASH", "MPESA"] as const;