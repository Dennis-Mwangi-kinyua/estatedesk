export const REPORTS_GUIDANCE = [
  {
    title: "Tenant payments",
    description:
      "Verify M-Pesa, bank, and cash payments before reviewing collection totals.",
    href: "/dashboard/org/payments",
    actionLabel: "Open payments",
  },
  {
    title: "Rent charges",
    description:
      "Review billed rent periods and outstanding balances for the reporting month.",
    href: "/dashboard/org/charges",
    actionLabel: "View charges",
  },
  {
    title: "Tenant directory",
    description:
      "Open tenant records to confirm lease status, contact details, and unit assignments.",
    href: "/dashboard/org/tenants",
    actionLabel: "View tenants",
  },
  {
    title: "Data exports",
    description:
      "Download organization archives and migration packs from settings when needed.",
    href: "/dashboard/org/settings/data-export",
    actionLabel: "Open exports",
  },
] as const;