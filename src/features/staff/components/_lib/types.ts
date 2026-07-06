import type { StaffRole } from "@/features/staff/constants/role-meta";

export type AssignmentTargetType = "PROPERTY" | "BUILDING";

export type AssignmentTarget = {
  id: string;
  type: AssignmentTargetType;
  label: string;
  searchText: string;
};

export type CreateMembershipState = {
  ok: boolean;
  message?: string;
  step?: number;
  field?: string;
};

export type CreateAction = (
  previousState: CreateMembershipState,
  formData: FormData,
) => Promise<CreateMembershipState>;

export type SimpleAction = (formData: FormData) => void | Promise<void>;

export type MemberFormProps = {
  action: CreateAction | SimpleAction;
  defaultValues?: {
    fullName?: string;
    username?: string;
    email?: string;
    phone?: string;
    role?: StaffRole;
    salaryAmount?: string;
    salaryCurrency?: string;
    educationLevel?: string;
    jobTitle?: string;
    nationalId?: string;
    emergencyContact?: string;
    staffProfileNotes?: string;
  };
  submitLabel?: string;
  lockedRole?: StaffRole;
  assignmentTargets?: AssignmentTarget[];
};

export type FormValues = {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  salaryAmount: string;
  salaryCurrency: string;
  educationLevel: string;
  jobTitle: string;
  nationalId: string;
  emergencyContact: string;
  staffProfileNotes: string;
  password: string;
  confirmPassword: string;
  assignmentNotes: string;
  assignmentIsPrimary: boolean;
};

export type FormValueChangeHandler = <K extends keyof FormValues>(
  key: K,
  value: FormValues[K],
) => void;