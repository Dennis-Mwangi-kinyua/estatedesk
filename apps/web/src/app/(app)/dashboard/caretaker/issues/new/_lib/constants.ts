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
