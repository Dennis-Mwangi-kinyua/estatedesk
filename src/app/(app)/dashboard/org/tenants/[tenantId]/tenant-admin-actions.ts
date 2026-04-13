"use server";

import {
  archiveTenant,
  blacklistTenant,
  restoreTenant,
  softDeleteTenant,
  unlinkTenantFromUnit,
} from "./actions";
import { requireUserSession } from "@/lib/auth/session";
import { enforceTenantAdminRateLimit } from "@/lib/rate-limit/tenant-admin-rate-limit";

function getTenantId(formData: FormData) {
  const tenantId = String(formData.get("tenantId") || "").trim();
  if (!tenantId) {
    throw new Error("Missing tenant ID.");
  }
  return tenantId;
}

function getReason(formData: FormData) {
  return String(formData.get("reason") || "").trim();
}

async function guard(formData: FormData, actionName: string, requireReason = false) {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    throw new Error("No active organisation found.");
  }

  if (
    !session.activeOrgRole ||
    !["ADMIN", "MANAGER", "OFFICE"].includes(String(session.activeOrgRole))
  ) {
    throw new Error("You do not have permission to perform this action.");
  }

  const tenantId = getTenantId(formData);
  const reason = getReason(formData);

  if (requireReason && !reason) {
    throw new Error("A reason is required for this action.");
  }

  await enforceTenantAdminRateLimit({
    orgId: String(session.activeOrgId),
    userId: String(session.userId),
    tenantId,
    actionName,
  });

  return { tenantId, reason };
}

export async function unlinkTenantFromUnitAction(formData: FormData) {
  await guard(formData, "unlink", true);
  return unlinkTenantFromUnit(formData);
}

export async function blacklistTenantAction(formData: FormData) {
  await guard(formData, "blacklist", true);
  return blacklistTenant(formData);
}

export async function archiveTenantAction(formData: FormData) {
  await guard(formData, "archive");
  return archiveTenant(formData);
}

export async function softDeleteTenantAction(formData: FormData) {
  await guard(formData, "soft-delete", true);
  return softDeleteTenant(formData);
}

export async function restoreTenantAction(formData: FormData) {
  await guard(formData, "restore");
  return restoreTenant(formData);
}

export async function reactivateTenantAction(formData: FormData) {
  await guard(formData, "reactivate");
  return restoreTenant(formData);
}