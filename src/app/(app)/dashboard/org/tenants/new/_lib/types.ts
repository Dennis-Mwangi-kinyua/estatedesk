import type { ReactNode } from "react";

export type AvailableUnit = {
  id: string;
  label: string;
  rentAmount: number;
  depositAmount: number | null;
};

export type Step = 1 | 2 | 3 | 4 | 5;

export type ActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  credentials?: {
    tenantName: string;
    username: string;
    password: string;
    email: string | null;
    phone: string;
    loginUrl: string;
  };
};

export type PreviewData = {
  fullName: string;
  phone: string;
  email: string;
  nationalId: string;
  kraPin: string;
  status: string;
  notes: string;
  nextOfKinName: string;
  nextOfKinRelationship: string;
  nextOfKinPhone: string;
  nextOfKinEmail: string;
  selectedUnitLabel: string;
  leaseStartDate: string;
  dueDay: string;
  monthlyRent: string;
  deposit: string;
  username: string;
  password: string;
};

export type NewTenantFormProps = {
  orgName: string;
  currencyCode: string;
  availableUnits: AvailableUnit[];
};

export type StepItem = {
  id: Step;
  title: string;
  description: string;
};

export type SectionTitleProps = {
  title: string;
  description: string;
};

export type FieldLabelProps = {
  children: ReactNode;
  required?: boolean;
};

export type InfoCardProps = {
  title: string;
  children: ReactNode;
};