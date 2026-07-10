import {
  ChargeType,
  GatewayStatus,
  PaymentMethod,
  PaymentTargetType,
  Prisma,
  VerificationStatus,
} from "@prisma/client";
import type { PaymentItem } from "@/app/(app)/dashboard/tenant/payments/_lib/types";

export function formatMoney(value: Prisma.Decimal | number | null | undefined) {
  if (value == null) return "N/A";
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function getPaymentMethodLabel(method: PaymentMethod) {
  switch (method) {
    case "MPESA_STK":
      return "M-Pesa STK";
    case "MPESA_MANUAL":
      return "M-Pesa / mobile money";
    case "BANK":
      return "Bank";
    case "CASH":
      return "Cash";
    default:
      return method;
  }
}

export function getChargeTypeLabel(type: ChargeType | null | undefined) {
  switch (type) {
    case "RENT":
      return "Rent";
    case "WATER":
      return "Water Bill";
    case "SERVICE_CHARGE":
      return "Service Charge";
    case "OTHER":
      return "Garbage";
    default:
      return null;
  }
}

export function getTargetLabel(targetType: PaymentTargetType) {
  switch (targetType) {
    case "RENT":
      return "Rent";
    case "WATER":
      return "Water Bill";
    case "DEPOSIT":
      return "Deposit";
    case "COMBINED":
      return "Rent + Water";
    case "OTHER":
      return "Other";
    default:
      return targetType;
  }
}

export function getGatewayClasses(status: GatewayStatus) {
  switch (status) {
    case "SUCCESS":
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/35 dark:bg-emerald-500/15 dark:text-emerald-200";
    case "PENDING":
    case "INITIATED":
      return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/35 dark:bg-amber-500/15 dark:text-amber-200";
    case "FAILED":
    case "CANCELLED":
      return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/35 dark:bg-rose-500/15 dark:text-rose-200";
    default:
      return "border-border bg-muted text-foreground dark:bg-muted/50";
  }
}

export function getVerificationClasses(status: VerificationStatus) {
  switch (status) {
    case "VERIFIED":
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/35 dark:bg-emerald-500/15 dark:text-emerald-200";
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/35 dark:bg-amber-500/15 dark:text-amber-200";
    case "REJECTED":
      return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/35 dark:bg-rose-500/15 dark:text-rose-200";
    case "NOT_REQUIRED":
      return "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/35 dark:bg-sky-500/15 dark:text-sky-200";
    default:
      return "border-border bg-muted text-foreground dark:bg-muted/50";
  }
}

export function getPaymentTitle(payment: PaymentItem) {
  if (payment.rentCharge) {
    const chargeLabel = getChargeTypeLabel(payment.rentCharge.chargeType);

    if (chargeLabel) {
      return `${chargeLabel} • ${payment.rentCharge.period}`;
    }

    return `Charge • ${payment.rentCharge.period}`;
  }

  if (payment.waterBill) {
    return `Water Bill • ${payment.waterBill.period}`;
  }

  return getTargetLabel(payment.targetType);
}

export function getPaymentSubtitle(payment: PaymentItem) {
  if (payment.rentCharge?.lease?.unit) {
    const unit = payment.rentCharge.lease.unit;
    return `${unit.property.name} • Unit ${unit.houseNo}`;
  }

  if (payment.waterBill?.unit) {
    const unit = payment.waterBill.unit;
    return `${unit.property.name} • Unit ${unit.houseNo}`;
  }

  return payment.reference || "Tenant payment";
}

export function getPaymentCategory(payment: PaymentItem) {
  if (payment.rentCharge?.chargeType) {
    return getChargeTypeLabel(payment.rentCharge.chargeType) ?? "Other";
  }

  if (payment.waterBill) {
    return "Water Bill";
  }

  return getTargetLabel(payment.targetType);
}

export function getReceiptHref(payment: PaymentItem) {
  if (payment.receipt?.id) {
    return `/dashboard/tenant/receipts/${payment.receipt.id}`;
  }
  return null;
}

export function filterTenantPayments(payments: PaymentItem[]) {
  return payments.filter((payment) => {
    if (payment.waterBill) return true;

    if (payment.rentCharge?.chargeType) {
      return ["RENT", "SERVICE_CHARGE", "OTHER", "WATER"].includes(
        payment.rentCharge.chargeType,
      );
    }

    return (
      payment.targetType === "RENT" ||
      payment.targetType === "WATER" ||
      payment.targetType === "COMBINED" ||
      payment.targetType === "OTHER"
    );
  });
}