export type LandlordUnit = {
  id: string;
  houseNo: string;
  rentAmount: unknown;
  status: string;
  tenantName: string | null;
  paymentStatus: string;
  amountDue: unknown;
  amountPaid: unknown;
  balance: unknown;
};

export type LandlordProperty = {
  id: string;
  name: string;
  location: string | null;
  address: string | null;
  units: LandlordUnit[];
};

export type PropertyReport = {
  id: string;
  name: string;
  expected: number;
  paid: number;
  balance: number;
  paidCount: number;
  unpaidCount: number;
};

export type StrongestProperty = {
  name: string;
  rent: number;
  units: number;
} | undefined;

export type LandlordDashboardData = {
  displayName: string;
  currentPeriod: string;
  properties: LandlordProperty[];
  units: LandlordUnit[];
  occupiedUnits: number;
  vacantUnits: number;
  tenantNames: string[];
  occupancyRate: number;
  monthlyRent: number;
  monthlyAmountDue: number;
  monthlyAmountPaid: number;
  monthlyBalance: number;
  collectionRate: number;
  paidUnits: LandlordUnit[];
  unpaidUnits: LandlordUnit[];
  occupiedRent: number;
  vacantRent: number;
  averageRent: number;
  strongestProperty: StrongestProperty;
  propertyReports: PropertyReport[];
  atRiskUnits: LandlordUnit[];
  vacantUnitQueue: LandlordUnit[];
  collectionGap: number;
  portfolioHealth: "Healthy" | "Watch" | "Needs attention";
  healthTone: string;
};