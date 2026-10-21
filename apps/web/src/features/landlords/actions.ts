"use server";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { Prisma } from "@prisma/client";
import { requireOrgPermission, requirePlatformRole } from "@/lib/permissions/guards";
import { createLandlordAccount, mapLandlordProperties, reissueLandlordSetup, setLandlordAccess } from "./service";
import { accountLoginUrl } from "@/lib/notifications/account-login-url";
import type { CreatedAccountLogin } from "@/lib/notifications/recipient-message";

export type LandlordFormState = { error?: string; success?: string; credentials?: CreatedAccountLogin };
export type LandlordFormAction = (state: LandlordFormState, form: FormData) => Promise<LandlordFormState>;
async function context(form: FormData, platform: boolean, creating: boolean) {
  if (platform) {
    const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]);
    const orgId = String(form.get("orgId") ?? "");
    if (!orgId || orgId.length > 100) throw new Error("Choose an organization.");
    return { orgId, userId: session.userId };
  }
  const session = await requireOrgPermission(creating ? "org.users.manage" : "properties.manage");
  if (session.membershipScope?.scopeType !== "ORG") throw new Error("Organization-wide access is required to manage landlords.");
  return { orgId: session.activeOrgId!, userId: session.userId };
}
function refresh() {
  for (const path of ["/dashboard/org/landlords", "/platform/landlords", "/dashboard/landlord", "/dashboard/org/properties"]) revalidatePath(path);
}
async function create(form: FormData, platform: boolean): Promise<LandlordFormState> {
  try {
    const { orgId, userId } = await context(form, platform, true);
    const result = await createLandlordAccount(orgId, userId, { fullName: String(form.get("fullName") ?? ""), username: String(form.get("username") ?? ""), email: String(form.get("email") ?? "").trim(), phone: String(form.get("phone") ?? ""), propertyIds: form.getAll("propertyIds") });
    refresh();
    return { success: "Landlord account created and properties assigned.", credentials: { ...result, role: "LANDLORD", loginUrl: accountLoginUrl() } };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "This username, email, or phone is already registered. Use different account details." };
    return { error: "Unable to create the landlord. Check the account details and choose active properties in this organization." };
  }
}
async function map(form: FormData, platform: boolean): Promise<LandlordFormState> {
  try {
    const { orgId, userId } = await context(form, platform, false);
    await mapLandlordProperties(orgId, userId, String(form.get("landlordProfileId") ?? ""), form.getAll("propertyIds"));
    refresh();
    return { success: "Property assignments updated." };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: "Unable to update assignments. Check that the landlord and properties belong to this organization." };
  }
}
export async function createOrgLandlord(_state: LandlordFormState, form: FormData) { return create(form, false); }
export async function mapOrgLandlord(_state: LandlordFormState, form: FormData) { return map(form, false); }
export async function createPlatformLandlord(_state: LandlordFormState, form: FormData) { return create(form, true); }
export async function mapPlatformLandlord(_state: LandlordFormState, form: FormData) { return map(form, true); }

async function lifecycle(form: FormData, platform: boolean): Promise<LandlordFormState> {
  try {
    const { orgId, userId } = await context(form, platform, true);
    const profileId = String(form.get("landlordProfileId") ?? "");
    const operation = form.get("operation");
    if (operation === "setup") {
      const result = await reissueLandlordSetup(orgId, userId, profileId, platform);
      refresh();
      return { success: "A new one-hour setup link is ready. Previous links have been revoked.", credentials: { ...result, role: "LANDLORD", loginUrl: accountLoginUrl() } };
    }
    if (operation !== "suspend" && operation !== "reactivate") return { error: "Choose a valid account operation." };
    await setLandlordAccess(orgId, userId, profileId, operation === "reactivate", String(form.get("reason") ?? ""));
    refresh();
    return { success: operation === "reactivate" ? "Landlord access restored for this organization." : "Landlord access suspended for this organization. Active landlord sessions have been revoked." };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: "Unable to update landlord access. Check the organization, account, and reason. Shared or privileged accounts require platform account recovery." };
  }
}
export async function manageOrgLandlord(_state: LandlordFormState, form: FormData) { return lifecycle(form, false); }
export async function managePlatformLandlord(_state: LandlordFormState, form: FormData) { return lifecycle(form, true); }
