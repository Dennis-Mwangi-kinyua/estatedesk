export const ISSUES_WORKFLOW = [
  {
    step: "1",
    title: "Log the issue",
    description: "Capture title, property, unit, priority, and description.",
  },
  {
    step: "2",
    title: "Assign responsibility",
    description: "Link the issue to a caretaker, staff member, or contractor.",
  },
  {
    step: "3",
    title: "Track resolution",
    description: "Move from open to in-progress to resolved with timestamps.",
  },
] as const;

export const ISSUES_QUICK_ACTIONS = [
  {
    href: "/dashboard/caretaker/issues/new",
    title: "Create issue",
    description: "Log a new maintenance or tenant concern.",
  },
  {
    href: "/dashboard/caretaker/issues?status=OPEN",
    title: "Open issues",
    description: "Review tickets awaiting action.",
  },
  {
    href: "/dashboard/caretaker/issues?status=IN_PROGRESS",
    title: "In progress",
    description: "Track active field work.",
  },
  {
    href: "/dashboard/caretaker",
    title: "Dashboard",
    description: "Return to your caretaker overview.",
  },
  {
    href: "/dashboard/caretaker/inspections",
    title: "Inspections",
    description: "View scheduled inspections.",
  },
] as const;