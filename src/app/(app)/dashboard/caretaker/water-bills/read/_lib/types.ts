import type { getCaretakerMeterReadData } from "./queries";

export type CaretakerMeterReadPageData = Awaited<
  ReturnType<typeof getCaretakerMeterReadData>
>;

export type QuickEntryUnit = {
  id: string;
  houseNo: string;
  propertyName: string;
  buildingName: string | null;
  tenantName: string;
  previousReading: number;
};