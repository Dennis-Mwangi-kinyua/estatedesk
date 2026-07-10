import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getTenantLedger } from "@/lib/ledger";
import {
  emptyPaymentInstructions,
  parsePaymentInstructions,
  type PaymentInstructions,
} from "@/lib/payments/instructions";

const tokenHash = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export type TenantPortalContext = {
  tenant: {
    id: string;
    orgId: string;
    fullName: string;
    org: {
      id: string;
      name: string;
      phone: string | null;
      email: string | null;
      address: string | null;
    };
  } | null;
  paymentHealth: Awaited<ReturnType<typeof getTenantLedger>>["row"] | null;
  paymentInstructions: PaymentInstructions;
  unreadNotificationCount: number;
  pendingLeaseSignatures: Array<{
    id: string;
    role: string;
    envelopeId: string;
    leaseId: string;
    propertyName: string;
    unitName: string;
    expiresAt: Date;
  }>;
  caretakerContact: {
    fullName: string;
    phone: string | null;
    email: string | null;
  } | null;
  leaseDocuments: Array<{
    leaseId: string;
    serialNumber: string;
    verificationCode: string;
    propertyName: string;
    unitName: string;
  }>;
};

async function resolveCaretakerContact(input: {
  orgId: string;
  leaseId?: string | null;
  unitId?: string | null;
  propertyId?: string | null;
  buildingId?: string | null;
}) {
  if (input.leaseId) {
    const lease = await prisma.lease.findFirst({
      where: { id: input.leaseId, orgId: input.orgId, deletedAt: null },
      select: {
        caretaker: {
          select: { fullName: true, phone: true, email: true },
        },
      },
    });

    if (lease?.caretaker) {
      return lease.caretaker;
    }
  }

  const locationFilters = [
    input.unitId ? { unitId: input.unitId } : null,
    input.buildingId ? { buildingId: input.buildingId } : null,
    input.propertyId ? { propertyId: input.propertyId } : null,
  ].filter(Boolean) as Array<
    { unitId: string } | { buildingId: string } | { propertyId: string }
  >;

  if (locationFilters.length === 0) {
    return null;
  }

  const assignment = await prisma.caretakerAssignment.findFirst({
    where: {
      orgId: input.orgId,
      active: true,
      OR: locationFilters,
    },
    orderBy: [{ isPrimary: "desc" }, { assignedAt: "desc" }],
    select: {
      caretaker: {
        select: { fullName: true, phone: true, email: true },
      },
    },
  });

  return assignment?.caretaker ?? null;
}

export async function getTenantPortalContext(
  userId: string,
  orgId: string | null,
  options?: {
    leaseId?: string | null;
    unitId?: string | null;
    propertyId?: string | null;
    buildingId?: string | null;
  },
): Promise<TenantPortalContext> {
  const tenant = await prisma.tenant.findFirst({
    where: {
      userId,
      deletedAt: null,
      ...(orgId ? { orgId } : {}),
    },
    select: {
      id: true,
      orgId: true,
      fullName: true,
      org: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          address: true,
        },
      },
    },
  });

  if (!tenant) {
    return {
      tenant: null,
      paymentHealth: null,
      paymentInstructions: emptyPaymentInstructions,
      unreadNotificationCount: 0,
      pendingLeaseSignatures: [],
      caretakerContact: null,
      leaseDocuments: [],
    };
  }

  const activeOrgId = orgId ?? tenant.orgId;

  const [
    paymentLedger,
    settings,
    unreadNotificationCount,
    pendingSigners,
    caretakerContact,
    leaseDocuments,
  ] = await Promise.all([
    activeOrgId ? getTenantLedger(userId, activeOrgId) : Promise.resolve(null),
    prisma.organizationSettings.findUnique({
      where: { orgId: tenant.orgId },
      select: { customFields: true },
    }),
    prisma.notification.count({
      where: {
        orgId: tenant.orgId,
        readAt: null,
        OR: [{ tenantId: tenant.id }, { userId }],
      },
    }),
    prisma.leaseSignatureSigner.findMany({
      where: {
        userId,
        status: "PENDING",
        envelope: {
          orgId: tenant.orgId,
          status: { in: ["PENDING", "PARTIALLY_SIGNED"] },
          expiresAt: { gt: new Date() },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        role: true,
        envelopeId: true,
        envelope: {
          select: {
            expiresAt: true,
            lease: {
              select: {
                id: true,
                unit: {
                  select: {
                    houseNo: true,
                    property: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    }),
    resolveCaretakerContact({
      orgId: tenant.orgId,
      leaseId: options?.leaseId,
      unitId: options?.unitId,
      propertyId: options?.propertyId,
      buildingId: options?.buildingId,
    }),
    prisma.documentRecord.findMany({
      where: {
        orgId: tenant.orgId,
        documentType: "LEASE",
        entityType: "Lease",
      },
      orderBy: { issuedAt: "desc" },
      take: 10,
      select: {
        entityId: true,
        serialNumber: true,
        verificationCode: true,
        metadata: true,
      },
    }),
  ]);

  const activeLeases = await prisma.lease.findMany({
    where: {
      tenantId: tenant.id,
      orgId: tenant.orgId,
      deletedAt: null,
      status: "ACTIVE",
    },
    select: { id: true },
  });
  const activeLeaseIds = new Set(activeLeases.map((lease) => lease.id));

  const leaseDocDetails = await Promise.all(
    leaseDocuments
      .filter((doc) => activeLeaseIds.has(doc.entityId))
      .map(async (doc) => {
        const lease = await prisma.lease.findUnique({
          where: { id: doc.entityId },
          select: {
            unit: {
              select: {
                houseNo: true,
                property: { select: { name: true } },
              },
            },
          },
        });

        if (!lease) return null;

        return {
          leaseId: doc.entityId,
          serialNumber: doc.serialNumber,
          verificationCode: doc.verificationCode,
          propertyName: lease.unit.property.name,
          unitName: lease.unit.houseNo,
        };
      }),
  );

  return {
    tenant,
    paymentHealth: paymentLedger?.row ?? null,
    paymentInstructions: parsePaymentInstructions(settings?.customFields),
    unreadNotificationCount,
    pendingLeaseSignatures: pendingSigners.map((signer) => ({
      id: signer.id,
      role: signer.role,
      envelopeId: signer.envelopeId,
      leaseId: signer.envelope.lease.id,
      propertyName: signer.envelope.lease.unit.property.name,
      unitName: signer.envelope.lease.unit.houseNo,
      expiresAt: signer.envelope.expiresAt,
    })),
    caretakerContact,
    leaseDocuments: leaseDocDetails.filter(
      (doc): doc is NonNullable<typeof doc> => doc !== null,
    ),
  };
}

export async function issuePendingLeaseSigningUrl(signerId: string, userId: string) {
  const signer = await prisma.leaseSignatureSigner.findFirst({
    where: {
      id: signerId,
      userId,
      status: "PENDING",
      envelope: {
        status: { in: ["PENDING", "PARTIALLY_SIGNED"] },
        expiresAt: { gt: new Date() },
      },
    },
    select: { id: true },
  });

  if (!signer) {
    return null;
  }

  const token = crypto.randomBytes(32).toString("base64url");

  await prisma.leaseSignatureSigner.update({
    where: { id: signer.id },
    data: { tokenHash: tokenHash(token) },
  });

  return `/sign-lease/${token}`;
}