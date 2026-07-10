export type AllowedRole = "ADMIN" | "MANAGER" | "OFFICE" | "ACCOUNTANT";

export const ALLOWED_ROLES: AllowedRole[] = [
  "ADMIN",
  "MANAGER",
  "OFFICE",
  "ACCOUNTANT",
];

export type OrgContext = {
  orgId: string;
  role: AllowedRole;
  org: {
    id: string;
    name: string;
    slug: string;
    currencyCode: string;
    timezone: string;
  };
};

export type ApprovalQueueItem = {
  id: string;
  period: string;
  prevReading: number;
  currentReading: number;
  unitsUsed: number;
  createdAt: Date;
  submittedBy: {
    id: string;
    fullName: string;
    email: string | null;
  };
  photoAsset: {
    key: string;
    fileName: string;
  } | null;
  unit: {
    id: string;
    houseNo: string;
    property: {
      name: string;
      waterRatePerUnit: unknown;
      waterFixedCharge: unknown;
    };
  };
};

export type MoveOutQueueItem = {
  id: string;
  noticeDate: Date;
  moveOutDate: Date;
  status: string;
  notes: string | null;
  tenant: {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    waterBills: Array<{
      id: string;
      total: unknown;
      status: string;
    }>;
  };
  lease: {
    id: string;
    rentCharges: Array<{
      id: string;
      amountDue: unknown;
      amountPaid: unknown;
      balance: unknown;
      status: string;
    }>;
    unit: {
      houseNo: string;
      property: {
        name: string;
      };
      building: {
        name: string | null;
      } | null;
    };
  };
  inspection: {
    id: string;
    scheduledAt: Date;
    status: string;
  } | null;
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  /** Primary channel (prefer IN_APP). Prefer `channels` for display. */
  channel: string;
  /** All delivery channels for this logical event (deduped). */
  channels: string[];
  status: string;
  readAt: Date | null;
  createdAt: Date;
  user: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    status: string;
  } | null;
  tenant: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    status: string;
  } | null;
};

export type PaymentItem = {
  id: string;
  amount: unknown;
  method: string;
  targetType: string;
  gatewayStatus: string;
  verificationStatus: string;
  reference: string | null;
  externalReference: string | null;
  createdAt: Date;
  paidAt: Date | null;
  payerTenant: {
    fullName: string;
  };
  rentCharge: {
    period: string;
  } | null;
  waterBill: {
    period: string;
  } | null;
  taxCharge: {
    period: string;
    taxType: string;
  } | null;
};

export type PageData = {
  membership: OrgContext;
  approvalQueue: ApprovalQueueItem[];
  approvalQueueCount: number;
  moveOutQueue: MoveOutQueueItem[];
  notifications: NotificationItem[];
  recentPayments: PaymentItem[];
  metrics: {
    totalNotifications: number;
    unreadCount: number;
    queuedCount: number;
    sentCount: number;
    failedCount: number;
  };
};

export type NotificationFilter =
  | "all"
  | "unread"
  | "payments"
  | "issues"
  | "moveouts"
  | "water";

export type PageProps = {
  searchParams?: Promise<{
    filter?: string;
  }>;
};