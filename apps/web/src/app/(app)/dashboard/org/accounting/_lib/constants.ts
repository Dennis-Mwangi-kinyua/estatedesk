export const ACCOUNTING_WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Initialize ledger",
    description:
      "Create the chart of accounts and fiscal period so verified payments can post automatically.",
  },
  {
    step: "02",
    title: "Sync collections",
    description:
      "Post verified tenant payments to rent and water income with matching cash debits.",
  },
  {
    step: "03",
    title: "Record spend",
    description:
      "Accrue vendor bills to payables, pay them down, or post cash expenses and manual journals.",
  },
  {
    step: "04",
    title: "Review balances",
    description:
      "Reconcile cash, control accounts, trial balance, and chart of accounts before month-end.",
  },
] as const;

export const ACCOUNTING_GUIDANCE = [
  {
    title: "Operating expenditures",
    description:
      "Record property costs in the expenditures desk when you need tenant scope or chargeable flags.",
    href: "/dashboard/org/expenditures",
    actionLabel: "Open expenditures",
  },
  {
    title: "Rent collection",
    description:
      "Verified tenant payments post into the ledger and reduce outstanding rent balances.",
    href: "/dashboard/org/payments",
    actionLabel: "Payments desk",
  },
  {
    title: "Rent charges",
    description:
      "Review billed rent periods and balances before reconciling income in accounting.",
    href: "/dashboard/org/charges",
    actionLabel: "View charges",
  },
  {
    title: "Financial reports",
    description:
      "Export trial balance, income statement, and property-level summaries for audits.",
    href: "/dashboard/org/reports",
    actionLabel: "Open reports",
  },
  {
    title: "Worker finance tickets",
    description:
      "Caretakers and office staff submit spend requests here. Review and reply from the request queue.",
    href: "/dashboard/org/accounting/requests",
    actionLabel: "Open request queue",
  },
] as const;