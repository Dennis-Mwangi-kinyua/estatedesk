"use server";

import { createHash, randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { isSupportedCurrency } from "@/lib/currencies";
import { requireCurrentOrgId, requireOrgAccess } from "@/lib/auth/org";
import { requireUserSession } from "@/lib/auth/session";
import { createInvitation } from "@/lib/invitations/create-invitation";
import { writeAuditLog } from "@/lib/audit/security";
import {
  emptyBankAccountDetails,
  type OrgBankAccountDetails,
  type PaymentInstructions,
  mergePaymentInstructions,
} from "@/lib/payments/instructions";
import {
  isBankCatalogMethod,
  isKnownPaymentMethodId,
  PAYMENT_METHOD_CATALOG,
} from "@/lib/payments/methods-catalog";

const SETTINGS_PATH = "/dashboard/org/settings";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(formData: FormData, key: string) {
  const value = readString(formData, key);
  return value ? value : null;
}

function readBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function asObject(
  value: Prisma.JsonValue | null | undefined,
): Record<string, Prisma.JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, Prisma.JsonValue>;
}

async function ensureSettingsWriteAccess() {
  const orgId = await requireCurrentOrgId();
  const membership = await requireOrgAccess(orgId);

  if (!["ADMIN", "MANAGER"].includes(membership.role)) {
    throw new Error("Forbidden");
  }

  return { orgId, membership };
}

export async function updateOrganizationAction(formData: FormData) {
  const { orgId } = await ensureSettingsWriteAccess();

  const name = readString(formData, "organizationName");
  const slug = readString(formData, "slug");
  const email = readOptionalString(formData, "email");
  const phone = readOptionalString(formData, "phone");
  const address = readOptionalString(formData, "address");
  const timezone = readString(formData, "timezone");
  const currency = readString(formData, "currency").toUpperCase();

  if (!name || !slug || !timezone || !currency) {
    throw new Error("Name, slug, timezone, and currency are required.");
  }
  if (!isSupportedCurrency(currency)) {
    throw new Error("Select a supported East African or UAE currency.");
  }

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      name,
      slug,
      email,
      phone,
      address,
      timezone,
      currencyCode: currency,
    },
  });

  revalidatePath(SETTINGS_PATH);
}

export async function updatePreferencesAction(formData: FormData) {
  const { orgId } = await ensureSettingsWriteAccess();

  const existing = await prisma.organizationSettings.findUnique({
    where: { orgId },
    select: {
      features: true,
      notificationDefaults: true,
    },
  });

  const nextFeatures = {
    ...asObject(existing?.features),
    tenantPortal: readBoolean(formData, "tenantPortal"),
    issueTracking: readBoolean(formData, "issueTracking"),
    waterBilling: readBoolean(formData, "waterBilling"),
    taxTracking: readBoolean(formData, "taxTracking"),
  };

  const nextNotificationDefaults = {
    ...asObject(existing?.notificationDefaults),
    smsNotifications: readBoolean(formData, "smsNotifications"),
    emailNotifications: readBoolean(formData, "emailNotifications"),
  };

  await prisma.organizationSettings.upsert({
    where: { orgId },
    update: {
      features: nextFeatures,
      notificationDefaults: nextNotificationDefaults,
    },
    create: {
      orgId,
      features: nextFeatures,
      notificationDefaults: nextNotificationDefaults,
    },
  });

  revalidatePath(SETTINGS_PATH);
}

export async function updatePaymentInstructionsAction(formData: FormData) {
  const { orgId } = await ensureSettingsWriteAccess();

  const existing = await prisma.organizationSettings.findUnique({
    where: { orgId },
    select: {
      customFields: true,
    },
  });

  const enabledMethods = formData
    .getAll("enabledMethods")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => isKnownPaymentMethodId(value) || value === "kcb-transfer");

  const uniqueEnabled = [...new Set(enabledMethods)];
  const mpesaEnabled = uniqueEnabled.includes("mpesa");
  const kcbPaybillEnabled = uniqueEnabled.includes("kcb");

  const bankAccounts: Record<string, OrgBankAccountDetails> = {};
  for (const method of PAYMENT_METHOD_CATALOG) {
    if (!isBankCatalogMethod(method.id) && method.id !== "kcb") continue;
    if (method.id === "kcb") continue; // structured kcb paybill fields below
    if (!uniqueEnabled.includes(method.id)) continue;

    const account: OrgBankAccountDetails = {
      businessName: readString(formData, `bank_${method.id}_businessName`),
      accountName: readString(formData, `bank_${method.id}_accountName`),
      accountNumber: readString(formData, `bank_${method.id}_accountNumber`),
      branch: readString(formData, `bank_${method.id}_branch`),
      instructions: readString(formData, `bank_${method.id}_instructions`),
    };

    if (!account.accountName || !account.accountNumber) {
      throw new Error(
        `Enter account name and account number for ${method.name} before enabling it.`,
      );
    }

    bankAccounts[method.id] = account;
  }

  // Preserve any non-catalog accounts still enabled (legacy kcb-transfer)
  for (const methodId of uniqueEnabled) {
    if (bankAccounts[methodId] || methodId === "mpesa" || methodId === "kcb" || methodId === "airtel-money") {
      continue;
    }
    if (!methodId.startsWith("bank_") && methodId !== "kcb-transfer" && methodId !== "bank-other") {
      continue;
    }
    bankAccounts[methodId] = {
      ...emptyBankAccountDetails,
      businessName: readString(formData, `bank_${methodId}_businessName`),
      accountName: readString(formData, `bank_${methodId}_accountName`),
      accountNumber: readString(formData, `bank_${methodId}_accountNumber`),
      branch: readString(formData, `bank_${methodId}_branch`),
      instructions: readString(formData, `bank_${methodId}_instructions`),
    };
  }

  const airtelBusinessName = readString(formData, "airtelBusinessName");
  const airtelNumber = readString(formData, "airtelNumber");
  const airtelInstructions = readString(formData, "airtelInstructions");

  const methodNotes: Record<string, string> = {};
  if (uniqueEnabled.includes("airtel-money")) {
    methodNotes["airtel-money"] = airtelInstructions;
    methodNotes["airtel-money.number"] = airtelNumber;
    methodNotes["airtel-money.name"] = airtelBusinessName;
  }

  const paymentInstructions: PaymentInstructions = {
    enabledMethods: uniqueEnabled,
    mpesaEnabled,
    mpesaBusinessName: readString(formData, "mpesaBusinessName"),
    mpesaPaybill: readString(formData, "mpesaPaybill"),
    mpesaTillNumber: readString(formData, "mpesaTillNumber"),
    mpesaAccountNumber: readString(formData, "mpesaAccountNumber"),
    mpesaInstructions: readString(formData, "mpesaInstructions"),
    kcbPaybillEnabled,
    kcbBusinessName: readString(formData, "kcbBusinessName"),
    kcbPaybill: readString(formData, "kcbPaybill"),
    kcbAccountNumber: readString(formData, "kcbAccountNumber"),
    kcbAccountName: readString(formData, "kcbAccountName"),
    kcbInstructions: readString(formData, "kcbInstructions"),
    bankAccounts,
    // Legacy single-bank fields kept in sync with first enabled bank for older readers
    bankEnabled: Object.keys(bankAccounts).length > 0,
    bankName: Object.values(bankAccounts)[0]?.businessName ?? "",
    bankAccountName: Object.values(bankAccounts)[0]?.accountName ?? "",
    bankAccountNumber: Object.values(bankAccounts)[0]?.accountNumber ?? "",
    bankBranch: Object.values(bankAccounts)[0]?.branch ?? "",
    bankInstructions: Object.values(bankAccounts)[0]?.instructions ?? "",
    methodNotes,
    airtelBusinessName,
    airtelNumber,
    airtelInstructions,
  };

  if (
    paymentInstructions.mpesaEnabled &&
    !paymentInstructions.mpesaPaybill &&
    !paymentInstructions.mpesaTillNumber
  ) {
    throw new Error("Enter an M-Pesa Paybill or Till number before enabling M-Pesa.");
  }

  if (
    paymentInstructions.kcbPaybillEnabled &&
    (!paymentInstructions.kcbPaybill || !paymentInstructions.kcbAccountNumber)
  ) {
    throw new Error(
      "Enter the KCB paybill number and account number before enabling KCB paybill.",
    );
  }

  if (uniqueEnabled.includes("airtel-money") && !paymentInstructions.airtelNumber) {
    throw new Error(
      "Enter the Airtel Money business / till number before enabling Airtel Money.",
    );
  }

  await prisma.organizationSettings.upsert({
    where: { orgId },
    update: {
      customFields: mergePaymentInstructions(
        existing?.customFields,
        paymentInstructions,
      ),
    },
    create: {
      orgId,
      customFields: mergePaymentInstructions(null, paymentInstructions),
    },
  });

  revalidatePath(SETTINGS_PATH);
  revalidatePath("/dashboard/tenant/payments");
  revalidatePath("/dashboard/tenant/payments/new");
  revalidatePath("/dashboard/tenant/payments/checkout");
}

export async function updateBillingAction(formData: FormData) {
  const { orgId } = await ensureSettingsWriteAccess();

  const billingEmail = readOptionalString(formData, "billingEmail");
  const plan = readString(formData, "subscriptionPlan") as
    | "FREE"
    | "PRO"
    | "PLUS"
    | "ENTERPRISE";

  if (!["FREE", "PRO", "PLUS", "ENTERPRISE"].includes(plan)) {
    throw new Error("Invalid subscription plan.");
  }

  const existing = await prisma.subscription.findUnique({
    where: { orgId },
    select: {
      currentPeriodStart: true,
      currentPeriodEnd: true,
    },
  });

  const now = new Date();

  await prisma.subscription.upsert({
    where: { orgId },
    update: {
      billingEmail,
      plan,
    },
    create: {
      orgId,
      plan,
      status: "ACTIVE",
      billingEmail,
      currentPeriodStart: existing?.currentPeriodStart ?? now,
      currentPeriodEnd: existing?.currentPeriodEnd ?? addMonths(now, 1),
    },
  });

  revalidatePath(SETTINGS_PATH);
}

export async function inviteMemberAction(formData: FormData) {
  const { orgId } = await ensureSettingsWriteAccess();
  const session = await requireUserSession();

  const email = readString(formData, "email").toLowerCase();
  const role = readString(formData, "role") as
    | "ADMIN"
    | "MANAGER"
    | "OFFICE"
    | "ACCOUNTANT"
    | "CARETAKER"
    | "TENANT"
    | "LANDLORD";

  if (!email) {
    throw new Error("Email is required.");
  }

  if (
    ![
      "ADMIN",
      "MANAGER",
      "OFFICE",
      "ACCOUNTANT",
      "CARETAKER",
      "TENANT",
      "LANDLORD",
    ].includes(role)
  ) {
    throw new Error("Invalid role.");
  }

  const existingInvite = await prisma.invitation.findFirst({
    where: {
      orgId,
      email,
      status: "PENDING",
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
    },
  });

  if (existingInvite) {
    throw new Error("A pending invitation already exists for this email.");
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true },
  });

  const invitation = await createInvitation({
    orgId,
    invitedById: session.userId,
    email,
    role,
    orgName: org?.name ?? "EstateDesk workspace",
  });

  await writeAuditLog({
    orgId,
    actorUserId: session.userId,
    action: "INVITATION_CREATED",
    entityType: "Invitation",
    entityId: invitation.invitationId,
    metadata: {
      email,
      role,
      inviteUrl: invitation.inviteUrl,
    },
  });

  revalidatePath(SETTINGS_PATH);
}

export async function createApiKeyAction(formData: FormData) {
  const { orgId } = await ensureSettingsWriteAccess();
  const session = await requireUserSession();

  const name = readString(formData, "name");
  const expiresAtRaw = readString(formData, "expiresAt");

  if (!name) {
    throw new Error("API key name is required.");
  }

  const plainKey = `edk_${randomBytes(32).toString("hex")}`;
  const keyHash = createHash("sha256").update(plainKey).digest("hex");

  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;

  if (expiresAtRaw && Number.isNaN(expiresAt?.getTime())) {
    throw new Error("Invalid expiry date.");
  }

  await prisma.apiKey.create({
    data: {
      orgId,
      name,
      keyHash,
      expiresAt,
      createdById: session.userId,
      isActive: true,
    },
  });

  revalidatePath(SETTINGS_PATH);

  // Plain key is intentionally not returned here because this page is using
  // direct server-action form posts without client action state.
}

export async function toggleApiKeyStatusAction(formData: FormData) {
  const { orgId } = await ensureSettingsWriteAccess();

  const apiKeyId = readString(formData, "apiKeyId");
  const nextActive = readString(formData, "nextActive") === "true";

  if (!apiKeyId) {
    throw new Error("API key id is required.");
  }

  await prisma.apiKey.updateMany({
    where: {
      id: apiKeyId,
      orgId,
    },
    data: {
      isActive: nextActive,
    },
  });

  revalidatePath(SETTINGS_PATH);
}

export async function requestDataExportAction(formData: FormData) {
  const { orgId } = await ensureSettingsWriteAccess();
  const session = await requireUserSession();
  const reason = readOptionalString(formData, "reason");

  const existingPendingRequest = await prisma.dataExportRequest.findFirst({
    where: {
      orgId,
      status: "PENDING",
    },
    select: {
      id: true,
    },
  });

  if (existingPendingRequest) {
    throw new Error("A data export request is already pending review.");
  }

  const exportRequest = await prisma.dataExportRequest.create({
    data: {
      orgId,
      requestedByUserId: session.userId,
      reason,
      status: "PENDING",
    },
  });

  await writeAuditLog({
    orgId,
    actorUserId: session.userId,
    action: "DATA_EXPORT_REQUESTED",
    entityType: "DataExportRequest",
    entityId: exportRequest.id,
    metadata: {
      reasonProvided: Boolean(reason),
    },
  });

  revalidatePath(SETTINGS_PATH);
  revalidatePath("/platform/data-management");
}
