export const PROPERTIES_WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Create property",
    description:
      "Capture name, type, location, taxpayer profile, and water billing defaults.",
  },
  {
    step: "02",
    title: "Add buildings",
    description:
      "Register apartment blocks or building records under each property.",
  },
  {
    step: "03",
    title: "Configure units",
    description:
      "Attach house numbers, rent, and availability before onboarding tenants.",
  },
] as const;

export const PROPERTIES_GUIDANCE = [
  {
    title: "View buildings",
    description:
      "Review apartment blocks, occupancy, and caretaker coverage by building.",
    href: "/dashboard/org/buildings",
    actionLabel: "View buildings",
  },
  {
    title: "Review units",
    description:
      "Search unit inventory, vacancy, and rent defaults across the portfolio.",
    href: "/dashboard/org/units",
    actionLabel: "View units",
  },
  {
    title: "Onboard tenants",
    description:
      "Assign vacant units when creating tenants with active lease terms.",
    href: "/dashboard/org/tenants/new",
    actionLabel: "Add tenant",
  },
] as const;