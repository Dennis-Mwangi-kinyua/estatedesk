import type { getUnitDetailsData } from "./queries";

export type UnitDetailsPageProps = {
  params: Promise<{
    unitId: string;
  }>;
};

export type UnitDetailsViewData = Awaited<ReturnType<typeof getUnitDetailsData>>;