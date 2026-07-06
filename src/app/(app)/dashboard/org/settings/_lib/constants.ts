export const SETTINGS_WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Review workspace identity",
    description:
      "Confirm organization profile, contact details, timezone, and currency before onboarding staff.",
  },
  {
    step: "02",
    title: "Configure operations",
    description:
      "Set billing, workspace modules, payment instructions, and tenant portal preferences.",
  },
  {
    step: "03",
    title: "Control access",
    description:
      "Invite members, manage API keys, and request data exports when compliance requires it.",
  },
] as const;

export const SETTINGS_GUIDANCE = [
  {
    title: "Users and access",
    description:
      "Invite admins, managers, office staff, and accountants with the right organization roles.",
    href: "/dashboard/org/settings/users-access",
    actionLabel: "Manage members",
  },
  {
    title: "Billing and plan",
    description:
      "Review current plan, renewal date, and billing email before changing subscription tiers.",
    href: "/dashboard/org/settings/billing",
    actionLabel: "Open billing",
  },
  {
    title: "Platform support",
    description:
      "Escalate billing, access, or technical issues directly to platform administrators.",
    href: "/dashboard/org/support",
    actionLabel: "Message platform",
  },
] as const;