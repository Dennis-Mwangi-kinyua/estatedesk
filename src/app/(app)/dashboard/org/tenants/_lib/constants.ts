export const TENANTS_WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Create tenant profile",
    description:
      "Capture full name, phone, ID, and next-of-kin before assigning a unit.",
  },
  {
    step: "02",
    title: "Assign unit and lease",
    description:
      "Link the tenant to a vacant unit with monthly rent, deposit, and due day.",
  },
  {
    step: "03",
    title: "Track tenancy",
    description:
      "Monitor lease status, caretaker coverage, and rent collection from one directory.",
  },
] as const;

export const TENANTS_GUIDANCE = [
  {
    title: "Review leases",
    description:
      "Open the leases desk to see active, pending, and ended tenancy records.",
    href: "/dashboard/org/leases",
    actionLabel: "View leases",
  },
  {
    title: "Check rent charges",
    description:
      "Once leases are active, rent periods appear on the charges desk for collection.",
    href: "/dashboard/org/charges",
    actionLabel: "View charges",
  },
  {
    title: "Verify payments",
    description:
      "Confirm tenant payments and review monthly balances against active leases.",
    href: "/dashboard/org/payments",
    actionLabel: "Open payments",
  },
] as const;