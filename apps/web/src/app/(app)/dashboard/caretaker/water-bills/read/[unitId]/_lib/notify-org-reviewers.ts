import { prisma } from "@/lib/prisma";
import { notifyInAppAndPush } from "@/lib/notifications/notify";

export async function notifyOrgReviewers({
  orgId,
  houseNo,
  propertyName,
  period,
}: {
  orgId: string;
  houseNo: string;
  propertyName: string;
  period: string;
}) {
  const reviewers = await prisma.membership.findMany({
    where: {
      orgId,
      role: {
        in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
      },
      user: {
        deletedAt: null,
      },
    },
    select: {
      userId: true,
    },
  });

  if (reviewers.length === 0) return;

  await notifyInAppAndPush({
    db: prisma,
    orgId,
    recipients: reviewers.map(({ userId }) => ({ userId })),
    type: "GENERAL",
    title: "Meter reading submitted",
    message: `Unit ${houseNo} at ${propertyName} has a ${period} water reading waiting for verification approval.`,
  });
}