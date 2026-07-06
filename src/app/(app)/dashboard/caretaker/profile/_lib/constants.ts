export const PROFILE_QUICK_ACTIONS = [
  {
    href: "/dashboard/caretaker/notifications",
    title: "Notifications",
    description: "Review operational alerts sent to your account.",
  },
  {
    href: "/dashboard/caretaker/security",
    title: "Security",
    description: "Update password and account security settings.",
  },
  {
    href: "/change-password",
    title: "Change password",
    description: "Rotate your login credentials.",
  },
  {
    href: "/dashboard/caretaker",
    title: "Dashboard",
    description: "Return to your caretaker overview.",
  },
] as const;

export const PROFILE_GUIDANCE = [
  {
    title: "Organisation records",
    description:
      "Profile details are maintained by your organisation and reflect your employment account.",
  },
  {
    title: "Contact updates",
    description:
      "Ask your office or manager to update salary, emergency contact, or job title details.",
  },
  {
    title: "Device alerts",
    description:
      "Enable push alerts below to receive issue, inspection, and workflow updates in the field.",
  },
] as const;