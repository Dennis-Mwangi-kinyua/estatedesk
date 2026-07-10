import type { StaffRole } from "@/features/staff/constants/role-meta";
import type { CreateMembershipState, FormValues, MemberFormProps } from "./types";

export const CARETAKER_STEPS = ["Setup", "Profile", "Login", "Review"] as const;

export const STAFF_FORM_INPUT_CLASS =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20";

export const INITIAL_ACTION_STATE: CreateMembershipState = {
  ok: false,
};

export const ROLE_CAPABILITIES: Record<StaffRole, string[]> = {
  ADMIN: [
    "Manage organization settings and access.",
    "Create and update staff accounts.",
    "Review organization-wide records and dashboards.",
  ],
  MANAGER: [
    "Coordinate day-to-day property operations.",
    "Work with tenants, leases, issues, and inspections.",
    "Review operational dashboards and follow-up queues.",
  ],
  OFFICE: [
    "Maintain tenant, lease, and support records.",
    "Coordinate office workflows and communication.",
    "Assist managers with organization administration.",
  ],
  ACCOUNTANT: [
    "Manage rent, water, payments, and balances.",
    "Review finance reports and payment verification.",
    "Support billing and reconciliation workflows.",
  ],
  CARETAKER: [
    "Work within mapped properties, apartments, or blocks.",
    "Handle assigned inspections and maintenance follow-up.",
    "Submit field updates from their operational scope.",
  ],
};

export function getInitialValues(
  defaultValues: MemberFormProps["defaultValues"],
): FormValues {
  return {
    fullName: defaultValues?.fullName ?? "",
    username: defaultValues?.username ?? "",
    email: defaultValues?.email ?? "",
    phone: defaultValues?.phone ?? "",
    salaryAmount: defaultValues?.salaryAmount ?? "",
    salaryCurrency: defaultValues?.salaryCurrency ?? "KES",
    educationLevel: defaultValues?.educationLevel ?? "",
    jobTitle: defaultValues?.jobTitle ?? "",
    nationalId: defaultValues?.nationalId ?? "",
    emergencyContact: defaultValues?.emergencyContact ?? "",
    staffProfileNotes: defaultValues?.staffProfileNotes ?? "",
    password: "",
    confirmPassword: "",
    assignmentNotes: "",
    assignmentIsPrimary: true,
  };
}