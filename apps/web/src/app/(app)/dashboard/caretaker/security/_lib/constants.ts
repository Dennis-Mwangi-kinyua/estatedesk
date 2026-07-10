export const SECURITY_QUICK_ACTIONS = [
  {
    href: "/dashboard/caretaker/profile",
    title: "My profile",
    description: "Review employment and account details on record.",
  },
  {
    href: "/change-password",
    title: "Change password",
    description: "Rotate your login credentials.",
  },
  {
    href: "/dashboard/caretaker/notifications",
    title: "Notifications",
    description: "Review operational alerts sent to your account.",
  },
  {
    href: "/dashboard/caretaker",
    title: "Dashboard",
    description: "Return to your caretaker overview.",
  },
] as const;

export const SECURITY_GUIDANCE = [
  {
    title: "30-minute timeout",
    description:
      "EstateDesk signs you out automatically after 30 minutes of inactivity.",
  },
  {
    title: "Unrecognized devices",
    description:
      "Revoke any session you do not recognize, then change your password.",
  },
  {
    title: "Current device",
    description:
      "Use Log out on your current device when you finish work in the field.",
  },
] as const;