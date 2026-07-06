export const FINANCE_QUICK_ACTIONS = [
  {
    href: "/dashboard/caretaker/notifications",
    title: "Notifications",
    description: "Check approval or rejection feedback.",
  },
  {
    href: "/dashboard/caretaker/water-bills",
    title: "Water bills",
    description: "Review billing workflow for assigned units.",
  },
  {
    href: "/dashboard/caretaker/issues",
    title: "Issues",
    description: "Track maintenance tickets in your scope.",
  },
  {
    href: "/dashboard/caretaker",
    title: "Dashboard",
    description: "Return to your caretaker overview.",
  },
] as const;

export const FINANCE_GUIDANCE = [
  {
    title: "Attach clear details",
    description:
      "Include property, amount, and purpose so accounts can approve faster.",
  },
  {
    title: "Track decisions here",
    description:
      "Approved or rejected requests return feedback in this queue and notifications.",
  },
  {
    title: "Use assigned properties",
    description:
      "Only properties in your caretaker scope appear in the submission form.",
  },
] as const;