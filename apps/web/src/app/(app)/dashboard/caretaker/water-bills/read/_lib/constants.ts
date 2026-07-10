export const READ_QUICK_ACTIONS = [
  {
    href: "/dashboard/caretaker/water-bills",
    title: "Water bills",
    description: "Track submitted readings and issued bills.",
  },
  {
    href: "/dashboard/caretaker/issues",
    title: "Issues",
    description: "Review maintenance tickets in your scope.",
  },
  {
    href: "/dashboard/caretaker/tenants",
    title: "Tenants",
    description: "Open tenant records for assigned units.",
  },
  {
    href: "/dashboard/caretaker",
    title: "Dashboard",
    description: "Return to your caretaker overview.",
  },
] as const;

export const READ_GUIDANCE = [
  {
    title: "Capture both readings",
    description:
      "Enter the previous and current meter values before submitting to office.",
  },
  {
    title: "Use quick entry in the field",
    description:
      "Quick meter entry lets you submit one unit and jump to the next pending unit.",
  },
  {
    title: "Wait for office approval",
    description:
      "Submitted readings move to the water bills board for accounts review.",
  },
] as const;