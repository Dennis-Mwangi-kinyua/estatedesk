import { getCaretakerAllowedUnitIds } from "@/lib/caretaker/access";
import type { MembershipScope } from "@/lib/caretaker/access";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { prisma } from "@/lib/prisma";
import { decodePublicId } from "@/lib/public-id";

export async function getNewIssueUnitPrefill({
  orgId,
  caretakerUserId,
  membershipScope,
  publicUnitId,
}: {
  orgId: string;
  caretakerUserId: string;
  membershipScope: MembershipScope;
  publicUnitId?: string;
}) {
  if (!publicUnitId) {
    return null;
  }

  const unitId = decodePublicId(publicUnitId, "unit");

  const allowedUnitIds = await retryTransientDatabaseOperation(
    () =>
      getCaretakerAllowedUnitIds({
        orgId,
        caretakerUserId,
        membershipScope,
      }),
    { label: "caretaker new issue allowed units" },
  );

  if (!allowedUnitIds.includes(unitId)) {
    return null;
  }

  const unit = await retryTransientDatabaseOperation(
    () =>
      prisma.unit.findFirst({
        where: {
          id: unitId,
          deletedAt: null,
          isActive: true,
          property: {
            orgId,
            deletedAt: null,
          },
        },
        select: {
          id: true,
          houseNo: true,
          propertyId: true,
          property: {
            select: {
              id: true,
              name: true,
            },
          },
          building: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    { label: "caretaker new issue unit prefill" },
  );

  return unit;
}