"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import type { AppSession } from "@/lib/auth/session";
import { ensureTenantIdentity } from "@/lib/tenants/identity";

const VERIFY_TENANT_PATH = "/dashboard/org/verify-tenant";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

type OrgAdminSession = AppSession & {
  activeOrgId: string;
  activeOrgRole: "ADMIN";
};

async function requireOrgAdmin(): Promise<OrgAdminSession> {
  const session = await requireUserSession();

  if (!session.activeOrgId || session.activeOrgRole !== "ADMIN") {
    throw new Error("Only organisation admins can manage tenant transfers.");
  }

  return session as OrgAdminSession;
}

function buildReturnPath(search: string) {
  return search
    ? `${VERIFY_TENANT_PATH}?q=${encodeURIComponent(search)}`
    : VERIFY_TENANT_PATH;
}

export async function requestTenantTransferAction(formData: FormData) {
  const session = await requireOrgAdmin();
  const sourceTenantId = getString(formData, "sourceTenantId");
  const search = getString(formData, "search");
  const message = getString(formData, "message");

  if (!sourceTenantId) {
    throw new Error("Missing source tenant.");
  }

  const sourceTenant = await prisma.tenant.findFirst({
    where: {
      id: sourceTenantId,
      deletedAt: null,
    },
    select: {
      id: true,
      orgId: true,
      moveOutNotices: {
        take: 1,
        select: { id: true },
      },
      leases: {
        where: {
          deletedAt: null,
          status: "ACTIVE",
        },
        take: 1,
        select: { id: true },
      },
    },
  });

  if (!sourceTenant) {
    throw new Error("Tenant record could not be found.");
  }

  if (sourceTenant.orgId === session.activeOrgId) {
    throw new Error("This tenant already belongs to your organisation.");
  }

  const hasMovedOut =
    sourceTenant.moveOutNotices.length > 0 || sourceTenant.leases.length === 0;

  if (!hasMovedOut) {
    throw new Error("Transfers can only be requested for moved-out tenants.");
  }

  await prisma.tenantTransferRequest.upsert({
    where: {
      sourceTenantId_targetOrgId_status: {
        sourceTenantId,
        targetOrgId: session.activeOrgId,
        status: "PENDING",
      },
    },
    update: {
      message: message || null,
      requestedByUserId: session.userId,
      requestedAt: new Date(),
    },
    create: {
      sourceOrgId: sourceTenant.orgId,
      targetOrgId: session.activeOrgId,
      sourceTenantId,
      requestedByUserId: session.userId,
      message: message || null,
    },
  });

  revalidatePath(VERIFY_TENANT_PATH);
  revalidatePath(buildReturnPath(search));
}

export async function approveTenantTransferAction(formData: FormData) {
  const session = await requireOrgAdmin();
  const transferId = getString(formData, "transferId");

  if (!transferId) {
    throw new Error("Missing transfer request.");
  }

  await prisma.$transaction(async (tx) => {
    const transfer = await tx.tenantTransferRequest.findFirst({
      where: {
        id: transferId,
        sourceOrgId: session.activeOrgId,
        status: "PENDING",
      },
      include: {
        sourceTenant: true,
      },
    });

    if (!transfer) {
      throw new Error("Pending transfer request could not be found.");
    }

    const existingTenant = await tx.tenant.findFirst({
      where: {
        orgId: transfer.targetOrgId,
        OR: [
          { phone: transfer.sourceTenant.phone },
          ...(transfer.sourceTenant.email
            ? [{ email: transfer.sourceTenant.email }]
            : []),
        ],
      },
      select: { id: true },
    });

    const identity = await ensureTenantIdentity(tx, {
      tenantId: transfer.sourceTenant.id,
      fullName: transfer.sourceTenant.fullName,
      phone: transfer.sourceTenant.phone,
      email: transfer.sourceTenant.email,
      nationalId: transfer.sourceTenant.nationalId,
      kraPin: transfer.sourceTenant.kraPin,
    });

    const transferredTenantData = {
      type: transfer.sourceTenant.type,
      fullName: transfer.sourceTenant.fullName,
      companyName: transfer.sourceTenant.companyName,
      kraPin: transfer.sourceTenant.kraPin,
      phone: transfer.sourceTenant.phone,
      email: transfer.sourceTenant.email,
      nationalId: transfer.sourceTenant.nationalId,
      status:
        transfer.sourceTenant.status === "BLACKLISTED"
          ? ("BLACKLISTED" as const)
          : ("ACTIVE" as const),
      notes: [
        transfer.sourceTenant.notes,
        `Transferred from another organisation on ${new Date().toISOString().slice(0, 10)}.`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      dataConsent: transfer.sourceTenant.dataConsent,
      consentUpdatedAt: transfer.sourceTenant.consentUpdatedAt,
      marketingConsent: transfer.sourceTenant.marketingConsent,
      blacklistReason: transfer.sourceTenant.blacklistReason,
      blacklistedAt: transfer.sourceTenant.blacklistedAt,
      identityId: identity.id,
      deletedAt: null,
      archivedAt: null,
    };

    const targetTenant =
      (existingTenant
        ? await tx.tenant.update({
            where: { id: existingTenant.id },
            data: transferredTenantData,
            select: { id: true },
          })
        : null) ??
      (await tx.tenant.create({
        data: {
          orgId: transfer.targetOrgId,
          ...transferredTenantData,
        },
        select: { id: true },
      }));

    await tx.tenantTransferRequest.update({
      where: { id: transfer.id },
      data: {
        status: "APPROVED",
        reviewedByUserId: session.userId,
        reviewedAt: new Date(),
        createdTenantId: targetTenant.id,
      },
    });

    const existingTransferHistory = await tx.tenantHistoryRecord.findFirst({
      where: {
        tenantId: targetTenant.id,
        status: "TRANSFERRED",
      },
      select: { id: true },
    });

    const transferHistoryData = {
      orgId: transfer.targetOrgId,
      tenantId: targetTenant.id,
      identityId: identity.id,
      status: "TRANSFERRED" as const,
      notes: `Tenant profile transferred from ${transfer.sourceOrgId}.`,
      snapshot: {
        transferRequestId: transfer.id,
        sourceOrgId: transfer.sourceOrgId,
        sourceTenantId: transfer.sourceTenantId,
        approvedAt: new Date().toISOString(),
      },
    };

    if (existingTransferHistory) {
      await tx.tenantHistoryRecord.update({
        where: { id: existingTransferHistory.id },
        data: transferHistoryData,
      });
    } else {
      await tx.tenantHistoryRecord.create({
        data: transferHistoryData,
      });
    }
  });

  revalidatePath(VERIFY_TENANT_PATH);
  revalidatePath("/dashboard/org/tenants");
}

export async function rejectTenantTransferAction(formData: FormData) {
  const session = await requireOrgAdmin();
  const transferId = getString(formData, "transferId");
  const reviewNotes = getString(formData, "reviewNotes");

  if (!transferId) {
    throw new Error("Missing transfer request.");
  }

  await prisma.tenantTransferRequest.updateMany({
    where: {
      id: transferId,
      sourceOrgId: session.activeOrgId,
      status: "PENDING",
    },
    data: {
      status: "REJECTED",
      reviewedByUserId: session.userId,
      reviewedAt: new Date(),
      reviewNotes: reviewNotes || null,
    },
  });

  revalidatePath(VERIFY_TENANT_PATH);
}
