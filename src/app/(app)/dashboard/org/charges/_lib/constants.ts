export const CHARGES_WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Activate leases",
    description:
      "Rent charges are created against active leases with a monthly rent amount and due day.",
  },
  {
    step: "02",
    title: "Issue rent periods",
    description:
      "Each billing period becomes a charge with amount due, due date, and payment status.",
  },
  {
    step: "03",
    title: "Track collections",
    description:
      "Payments reduce balances and move charges from unpaid to partial or paid.",
  },
] as const;

export const CHARGES_GUIDANCE = [
  {
    title: "Start from leases",
    description:
      "If no charges appear yet, confirm tenants have active leases with rent configured.",
    href: "/dashboard/org/leases",
    actionLabel: "View leases",
  },
  {
    title: "Verify payments",
    description:
      "Recorded payments allocate to rent charges and update outstanding balances automatically.",
    href: "/dashboard/org/payments",
    actionLabel: "Open payments desk",
  },
  {
    title: "Review collection report",
    description:
      "Use the rent collection report to see paid, partial, and unpaid tenants by period.",
    href: "/dashboard/org/reports",
    actionLabel: "Open reports",
  },
] as const;