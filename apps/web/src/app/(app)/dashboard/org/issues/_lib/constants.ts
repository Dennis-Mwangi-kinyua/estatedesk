export const ISSUE_TRACKING_WORKFLOW = [
  {
    step: "01",
    title: "Report the issue",
    description:
      "Capture the problem, location, priority, and any property or unit context so the ticket starts with complete information.",
  },
  {
    step: "02",
    title: "Assign ownership",
    description:
      "Office staff allocate the ticket to a caretaker or team member. Assignment moves the issue into active follow-up.",
  },
  {
    step: "03",
    title: "Track to resolution",
    description:
      "Status moves from new to in progress, resolved, and closed. Every update stays visible in issue history.",
  },
] as const;

export const ISSUE_RAISING_CHANNELS = [
  {
    title: "Office desk report",
    description:
      "Admins, managers, and office staff can log maintenance issues directly from this workspace.",
    href: "/dashboard/org/issues/new",
    actionLabel: "Report first issue",
    audience: "office" as const,
  },
  {
    title: "Tenant maintenance request",
    description:
      "Tenants raise issues from their dashboard. Tickets stay linked to the correct unit and tenancy record.",
    href: "/dashboard/tenant/issues/report",
    actionLabel: "View tenant flow",
    audience: "tenant" as const,
  },
  {
    title: "Caretaker field update",
    description:
      "Assigned caretakers update progress, submit resolution notes, and keep on-site work accountable.",
    href: "/dashboard/caretaker/issues",
    actionLabel: "View caretaker desk",
    audience: "caretaker" as const,
  },
] as const;

export const ISSUE_LIFECYCLE_STAGES = [
  {
    label: "Reported",
    description: "Issue submitted with title, description, and priority.",
  },
  {
    label: "Assigned",
    description: "Caretaker or staff member owns the next action.",
  },
  {
    label: "In progress",
    description: "Work is underway and status updates stay visible.",
  },
  {
    label: "Resolved",
    description: "Work is complete and ready for review or tenant confirmation.",
  },
] as const;