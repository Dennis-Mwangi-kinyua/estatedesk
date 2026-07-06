export const WATER_BILLS_WORKFLOW = [
  {
    step: "1",
    title: "Read meters",
    description: "Capture previous and current readings for occupied assigned units.",
  },
  {
    step: "2",
    title: "Submit to office",
    description: "Send readings for review before they move into billing.",
  },
  {
    step: "3",
    title: "Track tenant bills",
    description: "Follow approved readings through issued tenant water bills.",
  },
] as const;

export const WATER_BILLS_QUICK_ACTIONS = [
  {
    href: "/dashboard/caretaker/water-bills/read",
    title: "Read meters",
    description: "Open the meter reading workspace.",
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
    href: "/dashboard/caretaker",
    title: "Dashboard",
    description: "Return to your caretaker overview.",
  },
] as const;