import type { TenantPortalContext } from "@/lib/tenant/get-tenant-portal-context";

export type TenantDashboardPaymentItem = {
  id: string;
  amount: unknown;
  reference: string | null;
  method: string;
  gatewayStatus: string;
  verificationStatus: string;
  createdAt: Date;
  paidAt: Date | null;
  receipt?: { id: string } | null;
};

export type TenantDashboardNotificationItem = {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: Date;
};

export type TenantDashboardIssueItem = {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: Date;
};

export type TenantDashboardWaterBillItem = {
  id: string;
  period: string;
  total: unknown;
  status: string;
  dueDate: Date;
};

export type TenantDashboardUnitImage = {
  id: string;
  key: string;
  fileName: string;
};

export type TenantDashboardActiveData = {
  fullName: string;
  propertyName?: string | null;
  buildingName?: string | null;
  houseNo?: string | null;
  leaseStatus?: string | null;
  monthlyRent?: unknown;
  dueDay?: number | null;
  images: TenantDashboardUnitImage[];
  recentPayments: TenantDashboardPaymentItem[];
  waterBills: TenantDashboardWaterBillItem[];
  notifications: TenantDashboardNotificationItem[];
  issues: TenantDashboardIssueItem[];
  portalContext: TenantPortalContext;
};

export type TenantDashboardHistoryRecord = {
  id: string;
  propertyName: string | null;
  unitHouseNo: string | null;
  buildingName: string | null;
  status: string;
  moveOutDate: Date | null;
  monthlyRent: unknown;
  paymentCount: number;
  totalPaid: unknown;
  org: { name: string };
};