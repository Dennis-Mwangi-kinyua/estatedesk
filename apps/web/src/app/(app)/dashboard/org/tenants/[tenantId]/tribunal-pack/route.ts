import { requireUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { generateTribunalPackPdf } from "@/lib/documents/tribunal-pack-pdf";
import { computeRentRewards } from "@/lib/rewards/rent-rewards";

export const dynamic = "force-dynamic";

/**
 * One-click Rent Restriction Tribunal pack export:
 * time-stamped notifications + financial history as a legal PDF bundle.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ tenantId: string }> },
) {
  const session = await requireUserSession();
  if (!session.activeOrgId) {
    return new Response("No active organisation.", { status: 403 });
  }
  if (
    !session.activeOrgRole ||
    !["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"].includes(session.activeOrgRole)
  ) {
    return new Response("Forbidden.", { status: 403 });
  }

  const { tenantId } = await context.params;
  const orgId = String(session.activeOrgId);

  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId, orgId, deletedAt: null },
    select: {
      id: true,
      userId: true,
      fullName: true,
      phone: true,
      nationalId: true,
      org: {
        select: { name: true, address: true, currencyCode: true },
      },
      leases: {
        where: { deletedAt: null },
        orderBy: { startDate: "desc" },
        take: 1,
        select: {
          id: true,
          startDate: true,
          endDate: true,
          monthlyRent: true,
          unit: {
            select: {
              houseNo: true,
              property: { select: { name: true } },
            },
          },
          rentCharges: {
            orderBy: [{ period: "desc" }, { chargeType: "asc" }],
            take: 60,
            select: {
              period: true,
              chargeType: true,
              amountDue: true,
              amountPaid: true,
              balance: true,
              status: true,
              dueDate: true,
            },
          },
        },
      },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 80,
        select: {
          amount: true,
          method: true,
          gatewayStatus: true,
          verificationStatus: true,
          paidAt: true,
          createdAt: true,
          externalReference: true,
          reference: true,
          targetType: true,
          coveredPeriods: true,
        },
      },
    },
  });

  if (!tenant) {
    return new Response("Tenant not found.", { status: 404 });
  }

  const lease = tenant.leases[0];

  const notifications = await prisma.notification.findMany({
    where: {
      orgId,
      OR: [
        { tenantId: tenant.id },
        ...(tenant.userId ? [{ userId: tenant.userId }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      createdAt: true,
      channel: true,
      type: true,
      title: true,
      message: true,
    },
  });

  const rewards = computeRentRewards(
    tenant.payments.map((p) => ({
      paidAt: p.paidAt ?? p.createdAt,
      amount: Number(p.amount),
      verificationStatus: p.verificationStatus,
      gatewayStatus: p.gatewayStatus,
    })),
  );

  const pdfBytes = await generateTribunalPackPdf({
    generatedAt: new Date(),
    organizationName: tenant.org.name,
    organizationAddress: tenant.org.address,
    tenantName: tenant.fullName,
    tenantPhone: tenant.phone,
    tenantNationalId: tenant.nationalId,
    propertyName: lease?.unit.property.name ?? "—",
    unitLabel: lease?.unit.houseNo ?? "—",
    leaseStart: lease?.startDate ?? null,
    leaseEnd: lease?.endDate ?? null,
    monthlyRent: lease ? Number(lease.monthlyRent) : null,
    currencyCode: tenant.org.currencyCode || "KES",
    charges: (lease?.rentCharges ?? []).map((c) => ({
      period: c.period,
      chargeType: c.chargeType,
      amountDue: Number(c.amountDue),
      amountPaid: Number(c.amountPaid),
      balance: Number(c.balance),
      status: c.status,
      dueDate: c.dueDate,
    })),
    payments: tenant.payments.map((p) => ({
      at: p.paidAt ?? p.createdAt,
      amount: Number(p.amount),
      method: p.method,
      status: `${p.gatewayStatus}/${p.verificationStatus}`,
      reference: p.externalReference ?? p.reference,
      targetType: p.targetType,
      period: p.coveredPeriods?.[0] ?? null,
    })),
    communications: notifications.map((n) => ({
      at: n.createdAt,
      channel: n.channel,
      subject: n.title,
      summary: n.message || n.type,
      direction: "outbound",
    })),
    notes: [
      `RentRewards snapshot: ${rewards.points} pts · tier ${rewards.tier} · streak ${rewards.streakMonths} mo`,
      "Export generated for Rent Restriction Tribunal filing support.",
    ],
  });

  const safeName = tenant.fullName.replace(/[^a-zA-Z0-9-_]+/g, "_").slice(0, 40);
  return new Response(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="tribunal-pack-${safeName}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
