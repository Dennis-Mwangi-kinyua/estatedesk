import { Prisma, type OrgRole, type UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import {
  type PaymentInstructions,
  parsePaymentInstructions,
} from "@/lib/payments/instructions";

export type Member = {
  id: string;
  name: string;
  email: string;
  role: OrgRole;
  status: UserStatus;
};

export type ApiKeyItem = {
  id: string;
  name: string;
  lastUsed: string;
  status: "ACTIVE" | "REVOKED";
};

export type DataExportRequestItem = {
  id: string;
  status: string;
  reason: string;
  reviewerNotes: string;
  requestedAt: string;
  reviewedAt: string;
  expiresAt: string;
  requestedBy: string;
  reviewedBy: string;
};

export type SettingsPageData = {
  organization: {
    id: string;
    name: string;
    slug: string;
    email: string;
    phone: string;
    address: string;
    timezone: string;
    currency: string;
    status: "ACTIVE" | "SUSPENDED" | "DISABLED";
  };
  subscription: {
    plan: "FREE" | "PRO" | "PLUS" | "ENTERPRISE";
    status: "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
    billingEmail: string;
    renewalDate: string;
  };
  preferences: {
    tenantPortal: boolean;
    issueTracking: boolean;
    waterBilling: boolean;
    taxTracking: boolean;
    smsNotifications: boolean;
    emailNotifications: boolean;
  };
  paymentInstructions: PaymentInstructions;
  members: Member[];
  apiKeys: ApiKeyItem[];
  dataExportRequests: DataExportRequestItem[];
};

export function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(value);
}

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function asObject(
  value: Prisma.JsonValue | null | undefined,
): Record<string, Prisma.JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, Prisma.JsonValue>;
}

function getBoolean(
  source: Prisma.JsonValue | null | undefined,
  key: string,
  fallback = false,
) {
  const obj = asObject(source);
  return typeof obj[key] === "boolean" ? (obj[key] as boolean) : fallback;
}

export async function getSettingsPageData(
  orgId: string,
): Promise<SettingsPageData> {
  const org = await retryTransientDatabaseOperation(
    () =>
      prisma.organization.findFirstOrThrow({
        where: { id: orgId, deletedAt: null },
        include: {
          settings: true,
          subscription: true,
          memberships: {
            where: { user: { deletedAt: null } },
            include: { user: true },
            orderBy: { createdAt: "desc" },
          },
          apiKeys: { orderBy: { createdAt: "desc" } },
          dataExportRequests: {
            orderBy: { requestedAt: "desc" },
            take: 8,
            include: {
              requestedBy: { select: { fullName: true, email: true } },
              reviewedBy: { select: { fullName: true, email: true } },
            },
          },
        },
      }),
    { label: "getSettingsPageData-find-organization" },
  );

  const features = org.settings?.features;
  const notificationDefaults = org.settings?.notificationDefaults;

  return {
    organization: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      email: org.email ?? "",
      phone: org.phone ?? "",
      address: org.address ?? "",
      timezone: org.timezone,
      currency: org.currencyCode,
      status: org.status,
    },
    subscription: {
      plan: org.subscription?.plan ?? "FREE",
      status: org.subscription?.status ?? "ACTIVE",
      billingEmail: org.subscription?.billingEmail ?? org.email ?? "",
      renewalDate: formatDate(org.subscription?.currentPeriodEnd),
    },
    preferences: {
      tenantPortal: getBoolean(features, "tenantPortal"),
      issueTracking: getBoolean(features, "issueTracking"),
      waterBilling: getBoolean(features, "waterBilling"),
      taxTracking: getBoolean(features, "taxTracking"),
      smsNotifications: getBoolean(notificationDefaults, "smsNotifications"),
      emailNotifications: getBoolean(notificationDefaults, "emailNotifications"),
    },
    paymentInstructions: parsePaymentInstructions(org.settings?.customFields),
    members: org.memberships.map((membership) => ({
      id: membership.id,
      name: membership.user.fullName,
      email: membership.user.email ?? membership.user.phone ?? "—",
      role: membership.role,
      status: membership.user.status,
    })),
    apiKeys: org.apiKeys.map((key) => ({
      id: key.id,
      name: key.name,
      lastUsed: formatDateTime(key.lastUsedAt),
      status: key.isActive ? "ACTIVE" : "REVOKED",
    })),
    dataExportRequests: org.dataExportRequests.map((request) => ({
      id: request.id,
      status: request.status,
      reason: request.reason ?? "",
      reviewerNotes: request.reviewerNotes ?? "",
      requestedAt: formatDateTime(request.requestedAt),
      reviewedAt: formatDateTime(request.reviewedAt),
      expiresAt: formatDateTime(request.expiresAt),
      requestedBy:
        request.requestedBy.fullName ?? request.requestedBy.email ?? "Workspace user",
      reviewedBy:
        request.reviewedBy?.fullName ?? request.reviewedBy?.email ?? "Not reviewed",
    })),
  };
}
