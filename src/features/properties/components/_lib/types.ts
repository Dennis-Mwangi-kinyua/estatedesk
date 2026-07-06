import type { OrgRole } from "@prisma/client";

export type TaxpayerProfileOption = {
  id: string;
  displayName: string;
  kraPin: string;
  kind: string;
};

export type LandlordProfileOption = {
  id: string;
  displayName: string;
  phone: string | null;
  email: string | null;
};

export type ReviewSummary = {
  name: string;
  type: string;
  taxpayerProfile: string;
  landlord: string;
  location: string;
  address: string;
  notes: string;
  waterRatePerUnit: string;
  waterFixedCharge: string;
  isActive: boolean;
  unitMixCount: number;
  totalGeneratedUnits: number;
  unitMixLabels: string[];
};

export type LandlordMode = "none" | "existing" | "new";

export type PropertyCreateWizardProps = {
  orgName: string;
  currencyCode: string;
  errorMessage: string | null;
  taxpayerProfiles: TaxpayerProfileOption[];
  landlordProfiles: LandlordProfileOption[];
  helpOrgRole: OrgRole;
};