import type {
  AccountingRequestStatus,
  AccountingRequestType,
} from "@prisma/client";

export const REQUEST_TYPE_LABELS: Record<AccountingRequestType, string> = {
  REIMBURSEMENT: "Reimbursement",
  VENDOR_PAYMENT: "Vendor payment",
  PETTY_CASH: "Petty cash",
  ADVANCE: "Cash advance",
  OTHER: "Other",
};

export const REQUEST_STATUS_LABELS: Record<AccountingRequestStatus, string> = {
  SUBMITTED: "Submitted",
  IN_REVIEW: "In review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

export const PENDING_REVIEW_STATUSES: AccountingRequestStatus[] = [
  "SUBMITTED",
  "IN_REVIEW",
];

export const WORKER_SUBMIT_ROLES = ["CARETAKER", "OFFICE", "MANAGER", "ADMIN"] as const;

export const FINANCE_REVIEW_ROLES = ["ADMIN", "MANAGER", "ACCOUNTANT"] as const;

export const DEFAULT_EXPENSE_SYSTEM_KEY: Record<AccountingRequestType, string> = {
  REIMBURSEMENT: "MANAGEMENT_EXPENSE",
  VENDOR_PAYMENT: "OTHER_EXPENSE",
  PETTY_CASH: "OTHER_EXPENSE",
  ADVANCE: "OTHER_EXPENSE",
  OTHER: "OTHER_EXPENSE",
};

export const PAYABLES_ELIGIBLE_TYPES: AccountingRequestType[] = [
  "REIMBURSEMENT",
  "VENDOR_PAYMENT",
  "PETTY_CASH",
  "OTHER",
];