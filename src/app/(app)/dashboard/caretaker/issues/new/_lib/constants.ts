export const NEW_ISSUE_QUICK_ACTIONS = [
  {
    href: "/dashboard/caretaker/issues",
    title: "My issues",
    description: "Return to your maintenance issue board.",
  },
  {
    href: "/dashboard/caretaker/inspections",
    title: "Inspections",
    description: "Check scheduled move-out inspections.",
  },
  {
    href: "/dashboard/caretaker/notifications",
    title: "Notifications",
    description: "Review operational alerts sent to you.",
  },
  {
    href: "/dashboard/caretaker",
    title: "Dashboard",
    description: "Return to your caretaker overview.",
  },
] as const;

export const EMERGENCY_ISSUE_TEMPLATE = {
  title: "Emergency maintenance",
  description:
    "Urgent issue requiring immediate attention. Describe the safety risk, active leak, or access blocker.",
  priority: "URGENT",
} as const;

export const NEW_ISSUE_GUIDANCE = [
  {
    title: "Be specific",
    description:
      "Use a clear title and enough detail for office staff to triage the ticket.",
  },
  {
    title: "Set the right priority",
    description:
      "Reserve urgent for safety risks, active leaks, or access blockers.",
  },
  {
    title: "Track progress",
    description:
      "Submitted issues appear on your issues board with live status updates.",
  },
] as const;