import { Gift } from "lucide-react";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { computeRentRewards } from "@/lib/rewards/rent-rewards";
import { REWARD_CATALOG } from "@/lib/rewards/redeem";
import { TenantRewardsWorkspace } from "./_components/rewards-workspace";

export const dynamic = "force-dynamic";

export default async function TenantRewardsPage() {
  const session = await requireTenantAccess();
  const orgId = session.activeOrgId!;

  const tenant = await prisma.tenant.findFirst({
    where: {
      orgId,
      userId: session.userId,
      deletedAt: null,
    },
    select: {
      id: true,
      fullName: true,
      payments: {
        where: {
          OR: [
            { verificationStatus: { in: ["VERIFIED", "NOT_REQUIRED"] } },
            { gatewayStatus: "SUCCESS" },
          ],
        },
        select: {
          amount: true,
          paidAt: true,
          createdAt: true,
          verificationStatus: true,
          gatewayStatus: true,
        },
        orderBy: { createdAt: "desc" },
        take: 120,
      },
      rewardRedemptions: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          label: true,
          pointsCost: true,
          status: true,
          category: true,
          createdAt: true,
          fulfilledAt: true,
        },
      },
    },
  });

  if (!tenant) {
    return (
      <main className="p-6 text-sm text-muted-foreground">
        Tenant profile not found.
      </main>
    );
  }

  const snapshot = computeRentRewards(
    tenant.payments.map((p) => ({
      paidAt: p.paidAt ?? p.createdAt,
      amount: Number(p.amount),
      verificationStatus: p.verificationStatus,
      gatewayStatus: p.gatewayStatus,
    })),
  );

  const redeemedPoints = tenant.rewardRedemptions
    .filter((r) => r.status === "PENDING" || r.status === "FULFILLED")
    .reduce((s, r) => s + r.pointsCost, 0);

  const availablePoints = Math.max(0, snapshot.points - redeemedPoints);

  return (
    <TenantRewardsWorkspace
      tenantId={tenant.id}
      tenantName={tenant.fullName}
      snapshot={snapshot}
      availablePoints={availablePoints}
      redeemedPoints={redeemedPoints}
      catalog={REWARD_CATALOG}
      redemptions={tenant.rewardRedemptions}
    />
  );
}
