export const PAYMENTS_WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Verify payments",
    description:
      "Confirm M-Pesa, bank, or cash references before allocating rent and bill balances.",
  },
  {
    step: "02",
    title: "Reconcile statements",
    description:
      "Match verified payments against imported bank or mobile money statement records.",
  },
  {
    step: "03",
    title: "Review balances",
    description:
      "Track expected rent, paid amounts, deficits, and overdue defaults for the month.",
  },
] as const;

export const PAYMENTS_GUIDANCE = [
  {
    title: "Rent charges",
    description:
      "See billed rent periods and outstanding balances before reviewing collections.",
    href: "/dashboard/org/charges",
    actionLabel: "View charges",
  },
  {
    title: "Collection report",
    description:
      "Open the rent collection report for paid, partial, and unpaid tenant breakdowns.",
    href: "/dashboard/org/reports",
    actionLabel: "Open reports",
  },
  {
    title: "Accounting ledger",
    description:
      "Verified payments post into accounting once the ledger is initialized.",
    href: "/dashboard/org/accounting",
    actionLabel: "Open accounting",
  },
] as const;