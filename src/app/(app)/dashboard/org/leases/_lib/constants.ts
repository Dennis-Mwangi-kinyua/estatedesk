export const LEASES_WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Onboard tenant",
    description:
      "Add the tenant, assign a unit, and capture monthly rent, deposit, and due day.",
  },
  {
    step: "02",
    title: "Activate lease",
    description:
      "Move the lease from pending to active so billing periods and charges can be issued.",
  },
  {
    step: "03",
    title: "Bill and collect",
    description:
      "Rent charges appear on the charges desk; verified payments reduce balances automatically.",
  },
] as const;

export const LEASES_GUIDANCE = [
  {
    title: "Add a tenant with lease",
    description:
      "New leases are created when onboarding a tenant and assigning them to a vacant unit.",
    href: "/dashboard/org/tenants/new",
    actionLabel: "Add tenant",
  },
  {
    title: "Review rent charges",
    description:
      "Once leases are active, rent periods become charges you can track and collect.",
    href: "/dashboard/org/charges",
    actionLabel: "View charges",
  },
  {
    title: "Open payments desk",
    description:
      "Verify tenant payments and review monthly balances against active leases.",
    href: "/dashboard/org/payments",
    actionLabel: "Open payments",
  },
] as const;