import type { StaffRole } from "@/features/staff/constants/role-meta";

type MemberGuidanceItem = {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
};

export function getMemberDetailGuidance(
  role: StaffRole,
  roleSlug: string,
  membershipId: string,
): MemberGuidanceItem[] {
  const base: MemberGuidanceItem[] = [
    {
      title: "Edit profile",
      description: "Update contacts, HR details, and role information.",
      href: `/staff/${roleSlug}/${membershipId}/edit`,
      actionLabel: "Edit details",
    },
    {
      title: "Role directory",
      description: "Return to the roster for this organisation role.",
      href: `/staff/${roleSlug}`,
      actionLabel: "Open directory",
    },
    {
      title: "Previous employees",
      description: "Review staff who have already left the organisation.",
      href: "/staff/previous",
      actionLabel: "View register",
    },
  ];

  if (role === "CARETAKER") {
    return [
      {
        title: "Add caretaker",
        description: "Onboard another caretaker with property or apartment mapping.",
        href: "/staff/caretaker/new",
        actionLabel: "Add caretaker",
      },
      {
        title: "Field inspections",
        description: "Caretakers work from their mapped property or apartment scope.",
        href: "/dashboard/org/inspections",
        actionLabel: "Open inspections",
      },
      {
        title: "Maintenance issues",
        description: "Track caretaker follow-up from the issues desk.",
        href: "/dashboard/org/issues",
        actionLabel: "Open issues",
      },
      ...base,
    ];
  }

  return base;
}