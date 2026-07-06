export const CARETAKER_DASHBOARD_WORKFLOW = [
  {
    step: "01",
    title: "Review queues",
    description: "Check open issues, urgent tickets, and pending water bills in your scope.",
  },
  {
    step: "02",
    title: "Complete field work",
    description: "Finish scheduled inspections and submit meter readings on time.",
  },
  {
    step: "03",
    title: "Stay in touch",
    description: "Follow up with tenants and keep lease records current for assigned units.",
  },
] as const;

export const CARETAKER_DASHBOARD_GUIDANCE = [
  {
    title: "Today's work",
    description: "See inspections, meter readings, and urgent issues due today.",
    href: "/dashboard/caretaker/today",
    actionLabel: "Open command center",
  },
  {
    title: "Search workspace",
    description: "Find units, tenants, and issues across your assigned scope.",
    href: "/dashboard/caretaker/search",
    actionLabel: "Open search",
  },
  {
    title: "Weekly calendar",
    description: "Review inspections, move-outs, and billing deadlines for the week.",
    href: "/dashboard/caretaker/calendar",
    actionLabel: "Open calendar",
  },
  {
    title: "Unit profiles",
    description: "Open any assigned apartment for tenant, billing, and issue context.",
    href: "/dashboard/caretaker/units",
    actionLabel: "Browse units",
  },
  {
    title: "Report an issue",
    description: "Log maintenance or tenant concerns for apartments in your assignment.",
    href: "/dashboard/caretaker/issues/new",
    actionLabel: "New issue",
  },
  {
    title: "Water meter readings",
    description: "Capture readings and photos for units awaiting billing follow-up.",
    href: "/dashboard/caretaker/water-bills/read",
    actionLabel: "Read meters",
  },
  {
    title: "Documents locker",
    description: "Access official records and uploaded files for assigned units.",
    href: "/dashboard/caretaker/documents",
    actionLabel: "Open documents",
  },
  {
    title: "Office broadcasts",
    description: "Read general announcements sent by office staff.",
    href: "/dashboard/caretaker/broadcasts",
    actionLabel: "View broadcasts",
  },
  {
    title: "Shift handover",
    description: "Leave notes for the next caretaker shift and office follow-up.",
    href: "/dashboard/caretaker/handover",
    actionLabel: "Submit handover",
  },
  {
    title: "Vendor directory",
    description: "Contact approved vendors and request dispatch for issues.",
    href: "/dashboard/caretaker/vendors",
    actionLabel: "Browse vendors",
  },
  {
    title: "Caretaker help",
    description: "Guides for inspections, move-outs, and day-to-day field workflows.",
    href: "/dashboard/caretaker/help",
    actionLabel: "Open help",
  },
] as const;

export const CARETAKER_QUICK_ACTIONS = [
  {
    href: "/dashboard/caretaker/today",
    title: "Today's work",
    description: "Daily command center for field priorities.",
  },
  {
    href: "/dashboard/caretaker/search",
    title: "Search",
    description: "Find units, tenants, and issues quickly.",
  },
  {
    href: "/dashboard/caretaker/calendar",
    title: "Calendar",
    description: "Weekly schedule for inspections and billing.",
  },
  {
    href: "/dashboard/caretaker/units",
    title: "Units",
    description: "Assigned apartment profiles and quick actions.",
  },
  {
    href: "/dashboard/caretaker/issues",
    title: "Issues",
    description: "Review open maintenance and tenant concerns.",
  },
  {
    href: "/dashboard/caretaker/move-outs",
    title: "Move-outs",
    description: "Track tenant move-out notices in your scope.",
  },
  {
    href: "/dashboard/caretaker/documents",
    title: "Documents",
    description: "Official records and unit file uploads.",
  },
  {
    href: "/dashboard/caretaker/broadcasts",
    title: "Broadcasts",
    description: "Office announcements for caretakers.",
  },
  {
    href: "/dashboard/caretaker/handover",
    title: "Handover",
    description: "Submit shift notes for office records.",
  },
  {
    href: "/dashboard/caretaker/vendors",
    title: "Vendors",
    description: "Approved suppliers and dispatch requests.",
  },
  {
    href: "/dashboard/caretaker/inspections",
    title: "Inspections",
    description: "Check scheduled inspections and reports.",
  },
  {
    href: "/dashboard/caretaker/water-bills",
    title: "Water bills",
    description: "Track billing status and submit readings.",
  },
  {
    href: "/dashboard/caretaker/leases",
    title: "Leases",
    description: "View lease records tied to your assignments.",
  },
  {
    href: "/dashboard/caretaker/tenants",
    title: "Tenants",
    description: "Access tenant information and communication.",
  },
] as const;