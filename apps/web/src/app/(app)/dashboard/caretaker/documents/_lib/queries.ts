import {
  getCaretakerAllowedUnitIds,
  type MembershipScope,
} from "@/lib/caretaker/access";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { prisma } from "@/lib/prisma";
import { DOCUMENTS_LOAD_ERROR_MESSAGE } from "./helpers";

export async function getCaretakerDocumentsData({
  orgId,
  caretakerUserId,
  membershipScope,
}: {
  orgId: string;
  caretakerUserId: string;
  membershipScope: MembershipScope;
}) {
  try {
    const allowedUnitIds = await retryTransientDatabaseOperation(
      () =>
        getCaretakerAllowedUnitIds({
          orgId,
          caretakerUserId,
          membershipScope,
        }),
      { label: "caretaker documents allowed units" },
    );

    const tenantIds = await retryTransientDatabaseOperation(
      () =>
        prisma.lease.findMany({
          where: {
            orgId,
            deletedAt: null,
            status: "ACTIVE",
            unitId: { in: allowedUnitIds },
          },
          distinct: ["tenantId"],
          select: { tenantId: true },
        }),
      { label: "caretaker documents tenant ids" },
    );

    const tenantIdList = tenantIds.map((item) => item.tenantId);

    const [documentRecords, assets] = await retryTransientDatabaseOperation(
      () =>
        Promise.all([
          prisma.documentRecord.findMany({
            where: {
              orgId,
              status: { in: ["ISSUED", "COMPLETED"] },
              OR: [
                {
                  entityType: "Unit",
                  entityId: { in: allowedUnitIds },
                },
                {
                  entityType: "Tenant",
                  entityId: { in: tenantIdList },
                },
              ],
            },
            orderBy: { issuedAt: "desc" },
            take: 40,
            select: {
              id: true,
              title: true,
              documentType: true,
              entityType: true,
              entityId: true,
              issuedAt: true,
              serialNumber: true,
            },
          }),
          prisma.asset.findMany({
            where: {
              orgId,
              deletedAt: null,
              unitId: { in: allowedUnitIds },
            },
            orderBy: { createdAt: "desc" },
            take: 40,
            select: {
              id: true,
              fileName: true,
              key: true,
              mimeType: true,
              assetType: true,
              createdAt: true,
              unit: {
                select: {
                  houseNo: true,
                  property: { select: { name: true } },
                },
              },
            },
          }),
        ]),
      { label: "caretaker documents load" },
    );

    return {
      ok: true as const,
      documentRecords,
      assets,
      totalCount: documentRecords.length + assets.length,
    };
  } catch {
    return {
      ok: false as const,
      errorMessage: DOCUMENTS_LOAD_ERROR_MESSAGE,
      documentRecords: [],
      assets: [],
      totalCount: 0,
    };
  }
}