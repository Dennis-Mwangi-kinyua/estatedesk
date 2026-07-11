"use server";

import { Prisma, PropertyType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logServerError } from "@/lib/errors/server-error-log";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import {
  assertCanCreateProperty,
  assertCanCreateUnit,
} from "@/lib/billing/access";
import { requireOrgPermission } from "@/lib/permissions/guards";
import { sendAccountCredentials } from "@/lib/notifications/account-credentials";
import { getAuthorizedOrgId } from "./_lib/authorization";
import { executeCreatePropertyTransaction } from "./_lib/create-property-transaction";
import {
  normalizeEmail,
  normalizePhone,
  normalizeUsername,
  redirectWithError,
  toNonNegativeDecimal,
  toOptionalString,
  toRequiredString,
} from "./_lib/form-helpers";
import {
  ALLOWED_PROPERTY_TYPES,
  parseUnitPlans,
} from "./_lib/parse-unit-plans";

export async function createPropertyAction(formData: FormData) {
  const session = await requireOrgPermission("properties.manage");
  const orgId = await getAuthorizedOrgId(session.userId, session.activeOrgId);

  const name = toRequiredString(formData.get("name"), "Property name");
  const typeValue = toRequiredString(formData.get("type"), "Property type");
  const location = toOptionalString(formData.get("location"));
  const address = toOptionalString(formData.get("address"));
  const notes = toOptionalString(formData.get("notes"));
  const taxpayerProfileId = toOptionalString(formData.get("taxpayerProfileId"));
  const waterRatePerUnit = toNonNegativeDecimal(
    toOptionalString(formData.get("waterRatePerUnit")),
    "Water rate per unit",
  );
  const waterFixedCharge = toNonNegativeDecimal(
    toOptionalString(formData.get("waterFixedCharge")),
    "Water fixed charge",
  );
  const isActive = formData.get("isActive") === "on";
  const landlordMode = String(formData.get("landlordMode") ?? "none");
  const existingLandlordProfileId = toOptionalString(
    formData.get("existingLandlordProfileId"),
  );
  const landlordFullName = toOptionalString(formData.get("landlordFullName"));
  const landlordUsername = normalizeUsername(
    toOptionalString(formData.get("landlordUsername")),
  );
  const landlordPassword = toOptionalString(formData.get("landlordPassword"));
  const landlordEmail = normalizeEmail(toOptionalString(formData.get("landlordEmail")));
  const landlordPhone = normalizePhone(toOptionalString(formData.get("landlordPhone")));
  const landlordNationalId = toOptionalString(formData.get("landlordNationalId"));
  const landlordNotes = toOptionalString(formData.get("landlordNotes"));

  if (!ALLOWED_PROPERTY_TYPES.includes(typeValue as PropertyType)) {
    redirectWithError("Please choose a valid property type.");
  }

  if (name.length > 120) {
    redirectWithError("Property name is too long.");
  }

  if (location && location.length > 160) {
    redirectWithError("Location is too long.");
  }

  if (address && address.length > 220) {
    redirectWithError("Address is too long.");
  }

  if (notes && notes.length > 1500) {
    redirectWithError("Notes are too long.");
  }

  if (!["none", "existing", "new"].includes(landlordMode)) {
    redirectWithError("Please choose a valid landlord option.");
  }

  if (landlordMode === "existing" && !existingLandlordProfileId) {
    redirectWithError("Please choose an existing landlord.");
  }

  if (landlordMode === "new") {
    if (!landlordFullName) {
      redirectWithError("Landlord full name is required.");
    }

    if (!landlordUsername || landlordUsername.length < 3) {
      redirectWithError("Landlord username must be at least 3 characters.");
    }

    if (!landlordPassword || landlordPassword.length < 8) {
      redirectWithError("Landlord password must be at least 8 characters.");
    }
  }

  if (taxpayerProfileId) {
    const profile = await prisma.taxpayerProfile.findFirst({
      where: {
        id: taxpayerProfileId,
        orgId,
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!profile) {
      redirectWithError("The selected taxpayer profile is invalid.");
    }
  }

  const parsedUnitPlans = parseUnitPlans(formData);
  const plannedUnits = parsedUnitPlans.reduce(
    (sum, plan) => sum + (plan.quantity ?? 0),
    0,
  );

  try {
    await assertCanCreateProperty(orgId);
    if (plannedUnits > 0) {
      await assertCanCreateUnit(orgId, plannedUnits);
    }
  } catch (error) {
    redirectWithError(
      error instanceof Error ? error.message : "Plan limit reached.",
    );
  }

  try {
    await executeCreatePropertyTransaction({
      orgId,
      sessionUserId: session.userId,
      name,
      typeValue: typeValue as PropertyType,
      location,
      address,
      notes,
      taxpayerProfileId,
      waterRatePerUnit,
      waterFixedCharge,
      isActive,
      landlordMode,
      existingLandlordProfileId,
      landlordFullName,
      landlordUsername,
      landlordPassword,
      landlordEmail,
      landlordPhone,
      landlordNationalId,
      landlordNotes,
      parsedUnitPlans,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      redirectWithError(
        "A property with this name already exists in this organization.",
      );
    }

    logServerError("createPropertyAction", error);
    redirectWithError("Could not create the property. Please try again.");
  }

  revalidatePath("/dashboard/org");
  revalidatePath("/dashboard/org/properties");
  revalidatePath("/dashboard/org/units");

  if (landlordMode === "new") {
    await sendAccountCredentials({
      fullName: landlordFullName!,
      username: landlordUsername!,
      password: landlordPassword!,
      email: landlordEmail,
      phone: landlordPhone,
      role: "LANDLORD",
      loginUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/login`,
    });
  }

  redirect("/dashboard/org/properties?created=1");
}