export const SUPPORT_WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Describe the issue",
    description:
      "Use a clear subject and include organization context, billing period, or user affected.",
  },
  {
    step: "02",
    title: "Send to platform",
    description:
      "Messages go directly to platform administrators for billing, access, and technical review.",
  },
  {
    step: "03",
    title: "Track responses",
    description:
      "Recent messages stay on this page so you can follow open requests over time.",
  },
] as const;

export const SUPPORT_GUIDANCE = [
  {
    title: "Billing questions",
    description:
      "Include your organization name, billing period, and any invoice or subscription detail.",
    href: "/dashboard/org/settings/billing",
    actionLabel: "Open billing settings",
  },
  {
    title: "Access and roles",
    description:
      "For staff access issues, note the user email, role, and what they cannot open.",
    href: "/dashboard/org/staff",
    actionLabel: "View staff directory",
  },
  {
    title: "API integrations",
    description:
      "Technical integration requests are faster with endpoint, error text, and recent timestamps.",
    href: "/dashboard/org/settings/api-keys",
    actionLabel: "Review API settings",
  },
] as const;