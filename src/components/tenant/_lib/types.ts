export type TenantProfileViewModel = {
  id?: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  nationalId?: string | null;
  kraPin?: string | null;
  type?: "INDIVIDUAL" | "COMPANY" | null;
  status?: "ACTIVE" | "INACTIVE" | "BLACKLISTED" | null;
  companyName?: string | null;
  profileImageUrl?: string | null;
  dataConsent: boolean;
  marketingConsent: boolean;
  nextOfKin?: {
    name?: string | null;
    relationship?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
};

export type SensitiveFieldKey =
  | "phone"
  | "email"
  | "nationalId"
  | "kraPin"
  | "nextOfKinPhone"
  | "nextOfKinEmail";

export type RevealState = Record<SensitiveFieldKey, boolean>;