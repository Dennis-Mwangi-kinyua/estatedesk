import type { getCaretakerWaterBillsData } from "./queries";

export const CURRENT_PERIOD = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
}).format(new Date());

export type UnitWithLease = {
  id: string;
  houseNo: string;
  building: { name: string } | null;
  property: {
    id: string;
    name: string;
  };
  leases: Array<{
    tenant: {
      id: string;
      fullName: string;
    };
  }>;
};

export type PendingUnitCard = {
  id: string;
  property: string;
  building: string;
  houseNo: string;
  tenant: string;
  previousReading: number | string;
  currentReading: number | string | null;
  unitsUsed: number | string | null;
  period: string;
};

export type ReadingCard = PendingUnitCard & {
  id: string;
  submittedAt?: string;
};

export type IssuedBillCard = {
  id: string;
  property: string;
  building: string;
  houseNo: string;
  tenant: string;
  unitsUsed: unknown;
  total: unknown;
  dueDate: string;
  period: string;
};

export type CaretakerWaterBillsData = Awaited<
  ReturnType<typeof getCaretakerWaterBillsData>
>;