import type { loadVerifyTenantPageData } from "./queries";

export type VerifyTenantPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export type TenantVerificationResult = {
  id: string;
  orgId: string;
  fullName: string;
  phone: string;
  email: string | null;
  nationalId: string | null;
  kraPin: string | null;
  status: string;
  identityId: string | null;
  blacklistReason: string | null;
  blacklistedAt: Date | null;
  createdAt: Date;
  org: {
    id: string;
    name: string;
  };
  leases: Array<{
    id: string;
    startDate: Date;
    endDate: Date | null;
    status: string;
    monthlyRent: unknown;
    unit: {
      houseNo: string;
      property: { name: string | null } | null;
      building: { name: string | null } | null;
    } | null;
  }>;
  payments: Array<{
    id: string;
    amount: unknown;
    targetType: string;
    gatewayStatus: string;
    verificationStatus: string;
    paidAt: Date | null;
    createdAt: Date;
  }>;
  moveOutNotices: Array<{
    id: string;
    status: string;
    noticeDate: Date;
    moveOutDate: Date;
  }>;
  transferRequests: Array<{
    id: string;
    status: string;
    createdTenantId: string | null;
    requestedAt: Date;
    reviewedAt: Date | null;
  }>;
  identity: {
    id: string;
    historyRecords: Array<{
      id: string;
      orgId: string;
      status: string;
      propertyName: string | null;
      buildingName: string | null;
      unitHouseNo: string | null;
      leaseStartDate: Date | null;
      leaseEndDate: Date | null;
      moveOutDate: Date | null;
      monthlyRent: unknown;
      paymentCount: number;
      totalPaid: unknown;
      notes: string | null;
      createdAt: Date;
      org: {
        name: string;
      };
    }>;
    tenants: Array<{
      id: string;
      orgId: string;
      fullName: string;
      status: string;
      archivedAt: Date | null;
      org: {
        name: string;
      };
    }>;
  } | null;
};

export type VerifyTenantPageData = Awaited<ReturnType<typeof loadVerifyTenantPageData>>;