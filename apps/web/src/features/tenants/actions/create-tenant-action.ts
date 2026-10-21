"use server";

import { TenantStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireOrgPermission } from "@/lib/permissions/guards";
import { parseOpeningArrears } from "@/lib/tenants/opening-arrears";
import { safeServerActionError } from "@/lib/errors/server-error-log";
import { revalidatePublicVacancies } from "@/lib/public-vacancy-cache";
import { accountLoginUrl } from "@/lib/notifications/account-login-url";
import { buildAllocationDraft } from "@/lib/notifications/recipient-message";
import {
  isValidUsername,
  normalizeUsername,
} from "./_lib/credentials";
import { executeCreateTenantTransaction } from "./_lib/create-tenant-transaction";
import {
  toNonNegativeDecimal,
  toOptionalInt,
  toOptionalString,
  toRequiredString,
} from "./_lib/form-helpers";
import type { CreateTenantActionState } from "./_lib/types";

const ALLOWED_STATUSES: TenantStatus[] = ["ACTIVE", "INACTIVE", "BLACKLISTED"];

export async function createTenantAction(
  _prevState: CreateTenantActionState,
  formData: FormData,
): Promise<CreateTenantActionState> {
  try {
    const session = await requireOrgPermission("tenants.manage");
    const orgId = session.activeOrgId!;

    const fullName = toRequiredString(formData.get("fullName"), "Full name");
    const phone = toRequiredString(formData.get("phone"), "Phone");
    const email = toOptionalString(formData.get("email"));
    const nationalId = toOptionalString(formData.get("nationalId"));
    const kraPin = toOptionalString(formData.get("kraPin"));
    const notes = toOptionalString(formData.get("notes"));
    const unitId = toOptionalString(formData.get("unitId"));
    const leaseStartDateRaw = toOptionalString(formData.get("leaseStartDate"));
    const dueDayRaw = toOptionalString(formData.get("dueDay"));
    const monthlyRentRaw = toOptionalString(formData.get("monthlyRent"));
    const depositRaw = toOptionalString(formData.get("deposit"));
    const statusRaw = toRequiredString(formData.get("status"), "Status");

    const nextOfKinName = toRequiredString(
      formData.get("nextOfKinName"),
      "Next of kin name",
    );
    const nextOfKinRelationship = toRequiredString(
      formData.get("nextOfKinRelationship"),
      "Next of kin relationship",
    );
    const nextOfKinPhone = toRequiredString(
      formData.get("nextOfKinPhone"),
      "Next of kin phone",
    );
    const nextOfKinEmail = toOptionalString(formData.get("nextOfKinEmail"));
    const username = normalizeUsername(
      toRequiredString(formData.get("username"), "Username"),
    );
    const password = toRequiredString(formData.get("password"), "Password");
    const confirmPassword = toRequiredString(
      formData.get("confirmPassword"),
      "Confirm password",
    );

    if (!ALLOWED_STATUSES.includes(statusRaw as TenantStatus)) {
      throw new Error("Please choose a valid tenant status.");
    }

    if (fullName.length > 120) {
      throw new Error("Full name is too long.");
    }

    if (phone.length > 30) {
      throw new Error("Phone number is too long.");
    }

    if (email && email.length > 120) {
      throw new Error("Email is too long.");
    }

    const dueDay = toOptionalInt(dueDayRaw, "Rent due day");
    if (dueDay !== null && (dueDay < 1 || dueDay > 31)) {
      throw new Error("Rent due day must be between 1 and 31.");
    }

    const monthlyRent = toNonNegativeDecimal(monthlyRentRaw, "Monthly rent");
    const deposit = toNonNegativeDecimal(depositRaw, "Deposit");
    if (unitId && (monthlyRent === null || deposit === null)) {
      throw new Error("Enter the agreed monthly rent and deposit for this tenant. Enter 0 if no deposit is required.");
    }

    const leaseStartDate = leaseStartDateRaw
      ? new Date(leaseStartDateRaw)
      : new Date();

    if (Number.isNaN(leaseStartDate.getTime())) {
      throw new Error("Lease start date is invalid.");
    }
    const existingLease = formData.get("existingLease") === "on";
    if (existingLease && (!unitId || !leaseStartDateRaw || leaseStartDate > new Date())) {
      throw new Error("Assign a unit and enter the original lease start date (not in the future) for an existing lease.");
    }
    const openingArrears = parseOpeningArrears(formData, { existingLease, unitId, leaseStartDate });

    if (unitId && statusRaw !== "ACTIVE") {
      throw new Error(
        "A tenant must be Active if you want to assign a unit during creation.",
      );
    }

    if (!isValidUsername(username)) {
      throw new Error(
        "Username must be 3–30 characters and can only contain letters, numbers, dots, underscores, and hyphens.",
      );
    }

    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }

    if (password !== confirmPassword) {
      throw new Error("Password and confirmation do not match.");
    }

    const result = await executeCreateTenantTransaction({
      orgId,
      fullName,
      phone,
      email,
      nationalId,
      kraPin,
      notes,
      statusRaw: statusRaw as TenantStatus,
      nextOfKinName,
      nextOfKinRelationship,
      nextOfKinPhone,
      nextOfKinEmail,
      unitId,
      leaseStartDate,
      dueDay,
      monthlyRent,
      deposit,
      username,
      password,
      existingLease,
      openingArrears,
      actorUserId: session.userId,
    });

    revalidatePath("/dashboard/org/tenants");
    revalidatePath("/dashboard/org/units");
    revalidatePath("/dashboard/org/properties");
    revalidatePath("/dashboard/org");
    revalidatePath("/dashboard/org/charges");
    revalidatePath("/dashboard/org/payments");
    revalidatePath("/dashboard/tenant");
    revalidatePath("/dashboard/tenant/payments");
    revalidatePath("/dashboard/tenant/invoice");

    if (unitId) {
      revalidatePublicVacancies();
    }

    const loginUrl = accountLoginUrl();
    const allocation = result.allocation;
    const money = (amount: string) => new Intl.NumberFormat("en-KE", { style: "currency", currency: allocation?.currency ?? "KES" }).format(Number(amount));
    const allocationDraft = allocation ? buildAllocationDraft({ fullName: result.tenantName, email, phone, property: allocation.property, unit: allocation.unit, startDate: new Intl.DateTimeFormat("en-KE", { dateStyle: "long", timeZone: "Africa/Nairobi" }).format(new Date(allocation.startDate)), monthlyRent: money(allocation.monthlyRent), deposit: allocation.deposit ? money(allocation.deposit) : undefined, dueDay: allocation.dueDay, loginUrl }) : undefined;

    return {
      status: "success",
      allocationDraft,
      message: "Tenant account created successfully.",
      credentials: {
        tenantName: result.tenantName,
        username: result.username,
        setupUrl: result.setupUrl,
        email,
        phone,
        loginUrl,
      },
    };
  } catch (error) {
    return {
      status: "error",
      message: safeServerActionError(
        "createTenantAction",
        error,
        "Failed to create tenant account.",
      ),
    };
  }
}
