export const BUILDINGS_WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Register properties",
    description:
      "Each building belongs to a property with location and address context.",
  },
  {
    step: "02",
    title: "Add buildings",
    description:
      "Create apartment blocks or building records, then attach units underneath.",
  },
  {
    step: "03",
    title: "Assign caretakers",
    description:
      "Map field staff to buildings so tenants and units have clear coverage.",
  },
] as const;

export const BUILDINGS_GUIDANCE = [
  {
    title: "View properties",
    description:
      "Open the properties desk to review locations and portfolio structure.",
    href: "/dashboard/org/properties",
    actionLabel: "View properties",
  },
  {
    title: "Review units",
    description:
      "Search unit inventory, occupancy, and vacancy status across buildings.",
    href: "/dashboard/org/units",
    actionLabel: "View units",
  },
  {
    title: "Manage staff",
    description:
      "Assign caretakers and field staff from the staff directory.",
    href: "/staff",
    actionLabel: "Open staff directory",
  },
] as const;