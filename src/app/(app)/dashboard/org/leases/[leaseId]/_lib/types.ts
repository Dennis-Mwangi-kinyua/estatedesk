import type { loadLeaseDetailsData } from "./queries";

export type LeasePageProps = {
  params: Promise<{
    leaseId: string;
  }>;
};

export type LeaseDetailsData = Awaited<ReturnType<typeof loadLeaseDetailsData>>;