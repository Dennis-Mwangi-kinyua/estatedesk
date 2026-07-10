export const NOTIFICATIONS_QUICK_ACTIONS = [
  {
    href: "/dashboard/caretaker/issues",
    title: "Issues",
    description: "Review maintenance tickets in your scope.",
  },
  {
    href: "/dashboard/caretaker/inspections",
    title: "Inspections",
    description: "Check scheduled move-out inspections.",
  },
  {
    href: "/dashboard/caretaker/water-bills",
    title: "Water bills",
    description: "Track meter readings and billing.",
  },
  {
    href: "/dashboard/caretaker",
    title: "Dashboard",
    description: "Return to your caretaker overview.",
  },
] as const;

export const NOTIFICATIONS_GUIDANCE = [
  {
    title: "Assignment updates",
    description: "New property or unit coverage changes appear here first.",
  },
  {
    title: "Issue and inspection alerts",
    description: "Operational tickets and inspection tasks notify you in real time.",
  },
  {
    title: "Payment and billing notices",
    description: "Water billing and payment follow-ups also route through notifications.",
  },
] as const;