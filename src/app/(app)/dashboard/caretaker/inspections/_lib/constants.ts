export const INSPECTIONS_WORKFLOW = [
  {
    step: "1",
    title: "Open the task",
    description: "Review tenant, unit, and move-out details before arriving on site.",
  },
  {
    step: "2",
    title: "Complete the inspection",
    description: "Capture findings, photos, and condition notes during the visit.",
  },
  {
    step: "3",
    title: "Submit the report",
    description: "Send the report to the office for review and tenant follow-up.",
  },
] as const;

export const INSPECTIONS_QUICK_ACTIONS = [
  {
    href: "/dashboard/caretaker",
    title: "Dashboard",
    description: "Return to your caretaker overview.",
  },
  {
    href: "/dashboard/caretaker/issues",
    title: "Issues",
    description: "Review maintenance tickets in your scope.",
  },
  {
    href: "/dashboard/caretaker/leases",
    title: "Leases",
    description: "View lease records for assigned units.",
  },
  {
    href: "/dashboard/caretaker/help",
    title: "Help guides",
    description: "Move-out and inspection workflow references.",
  },
] as const;