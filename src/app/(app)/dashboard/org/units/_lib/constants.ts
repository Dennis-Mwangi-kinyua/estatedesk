export const UNITS_WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Register properties",
    description:
      "Properties and buildings define where units live in your portfolio structure.",
  },
  {
    step: "02",
    title: "Configure units",
    description:
      "Set house numbers, rent, deposit, bedrooms, and availability status per unit.",
  },
  {
    step: "03",
    title: "Fill vacancies",
    description:
      "Assign vacant units to new tenants and activate leases from the tenants desk.",
  },
] as const;

export const UNITS_GUIDANCE = [
  {
    title: "View properties",
    description:
      "Open the properties desk to review locations, buildings, and portfolio structure.",
    href: "/dashboard/org/properties",
    actionLabel: "View properties",
  },
  {
    title: "View buildings",
    description:
      "See apartment blocks and building groupings before drilling into individual units.",
    href: "/dashboard/org/buildings",
    actionLabel: "View buildings",
  },
  {
    title: "Onboard tenants",
    description:
      "Vacant units can be assigned when creating a new tenant with lease terms.",
    href: "/dashboard/org/tenants/new",
    actionLabel: "Add tenant",
  },
] as const;