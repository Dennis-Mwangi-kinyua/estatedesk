import type { ChargeStatus, ChargeType } from "@prisma/client";

export type OrgRentCharge = {
  id: string;
  period: string;
  amountDue: unknown;
  amountPaid: unknown;
  balance: unknown;
  status: ChargeStatus;
  chargeType: ChargeType;
  dueDate: Date;
  lease: {
    id: string;
    startDate: Date;
    tenant: {
      id: string;
      fullName: string;
    };
    unit: {
      houseNo: string;
      property: {
        id: string;
        name: string;
      };
      building: {
        name: string;
      } | null;
    };
  };
};

export type ChargesPageData = {
  organizationName: string;
  charges: OrgRentCharge[];
  stats: {
    totalCharges: number;
    unpaidCharges: number;
    partialCharges: number;
    paidCharges: number;
    overdueCharges: number;
    totalAmountDue: number;
    totalBalance: number;
  };
};