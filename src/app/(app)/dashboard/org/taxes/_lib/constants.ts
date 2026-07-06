export const TAXES_WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Connect KRA",
    description:
      "Link the organization taxpayer profile and confirm integration readiness.",
  },
  {
    step: "02",
    title: "File MRI returns",
    description:
      "Review rental income, tax due, and return status for each filing period.",
  },
  {
    step: "03",
    title: "Reconcile remittance",
    description:
      "Track submitted, acknowledged, and paid returns against payment activity.",
  },
] as const;

export const TAXES_GUIDANCE = [
  {
    title: "View payments",
    description:
      "Review rent collections and remittance activity tied to taxable income.",
    href: "/dashboard/org/payments",
    actionLabel: "Open payments",
  },
  {
    title: "Review charges",
    description:
      "Inspect rent charges that feed rental income and tax reporting.",
    href: "/dashboard/org/charges",
    actionLabel: "Open charges",
  },
  {
    title: "Open properties",
    description:
      "Confirm property and taxpayer profile coverage before filing returns.",
    href: "/dashboard/org/properties",
    actionLabel: "View properties",
  },
] as const;