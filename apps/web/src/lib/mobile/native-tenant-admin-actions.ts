import "server-only";
import type { AppSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type { NativeActionDefinition, NativeActionLink } from "@estatedesk/contracts/mobile";
import {
  archiveTenantAction,
  blacklistTenantAction,
  reactivateTenantAction,
  softDeleteTenantAction,
  unlinkTenantFromUnitAction,
} from "@/app/(app)/dashboard/org/tenants/[tenantId]/tenant-admin-actions";

const allowedRoles = ["ADMIN", "MANAGER", "OFFICE"] as const;
const canManageTenants = (session: AppSession) => !!session.activeOrgId && allowedRoles.includes(session.activeOrgRole as typeof allowedRoles[number]);

export function nativeTenantRecordActions(session: AppSession, path: string, tenant: { archivedAt: Date | null; blacklistedAt: Date | null; hasActiveLease: boolean }): NativeActionLink[] {
  if (path !== "/dashboard/org/tenants" || !canManageTenants(session)) return [];
  return [
    ...(tenant.hasActiveLease ? [{ id: "tenant.unlink", title: "Unlink from unit", destructive: true }] : []),
    ...(!tenant.blacklistedAt ? [{ id: "tenant.blacklist", title: "Blacklist tenant", destructive: true }] : []),
    ...(!tenant.archivedAt ? [{ id: "tenant.archive", title: "Archive tenant" }] : []),
    ...(tenant.archivedAt ? [{ id: "tenant.reactivate", title: "Restore retained profile" }] : []),
    ...(!tenant.hasActiveLease ? [{ id: "tenant.delete", title: "Soft delete tenant", destructive: true }] : []),
  ];
}

export async function nativeTenantActionDefinition(session: AppSession, kind: "organization" | "platform", path: string, actionId: string, tenantId?: string): Promise<NativeActionDefinition | null> {
  if (kind !== "organization" || path !== "/dashboard/org/tenants" || !tenantId || !canManageTenants(session)) return null;
  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId, orgId: session.activeOrgId!, deletedAt: null },
    select: { archivedAt: true, blacklistedAt: true, leases: { where: { status: "ACTIVE", deletedAt: null }, select: { id: true }, take: 1 } },
  });
  if (!tenant) return null;
  const action = nativeTenantRecordActions(session, path, { ...tenant, hasActiveLease: tenant.leases.length > 0 }).find(item => item.id === actionId);
  if (!action) return null;

  const requiredReason = ["tenant.unlink", "tenant.blacklist", "tenant.delete"].includes(actionId);
  const titles: Record<string, string> = {
    "tenant.unlink": "Unlink tenant from unit",
    "tenant.blacklist": "Blacklist tenant",
    "tenant.archive": "Archive tenant record",
    "tenant.delete": "Soft delete tenant profile",
    "tenant.reactivate": "Restore retained profile",
  };
  const descriptions: Record<string, string> = {
    "tenant.unlink": "End the current unit relationship. The lease and tenant history remain recorded.",
    "tenant.blacklist": "Restrict this tenant from future onboarding. Use only for a documented compliance reason.",
    "tenant.archive": "Keep the tenant record for history while removing it from active workflows.",
    "tenant.delete": "Hide this tenant profile from normal workflows. Existing lease history is retained.",
    "tenant.reactivate": "Restore this tenant profile to active records. Unit allocation and a new lease remain separate steps.",
  };
  const submitLabels: Record<string, string> = {
    "tenant.unlink": "Unlink tenant",
    "tenant.blacklist": "Blacklist tenant",
    "tenant.archive": "Archive tenant",
    "tenant.delete": "Soft delete tenant",
    "tenant.reactivate": "Reactivate tenant",
  };
  return {
    id: actionId,
    title: titles[actionId],
    description: descriptions[actionId],
    submitLabel: submitLabels[actionId],
    confirmation: `${descriptions[actionId]}${requiredReason ? " Enter a reason before continuing." : ""}`,
    destructive: action.destructive,
    groups: [{ id: "decision", title: "Review this change", fields: [
      { name: "reason", label: "Reason", type: "multiline", required: requiredReason, maxLength: 1000 },
    ] }],
  };
}

export async function executeNativeTenantAction(kind: "organization" | "platform", path: string, actionId: string, tenantId: string | undefined, form: FormData) {
  if (kind !== "organization" || path !== "/dashboard/org/tenants" || !tenantId) return null;
  const actions: Record<string, (data: FormData) => Promise<unknown>> = {
    "tenant.unlink": unlinkTenantFromUnitAction,
    "tenant.blacklist": blacklistTenantAction,
    "tenant.archive": archiveTenantAction,
    "tenant.delete": softDeleteTenantAction,
    "tenant.reactivate": reactivateTenantAction,
  };
  const action = actions[actionId];
  if (!action) return null;
  form.set("tenantId", tenantId);
  await action(form);
  const messages: Record<string, string> = { "tenant.delete": "Tenant profile deleted.", "tenant.unlink": "Tenant unlinked from unit.", "tenant.blacklist": "Tenant blacklisted.", "tenant.archive": "Tenant archived.", "tenant.reactivate": "Tenant profile restored." };
  return { ok: true as const, message: messages[actionId] };
}
