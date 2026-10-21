import "server-only";

import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo";
import { sendTransactionalEmail } from "@/lib/notifications/email";
import { buildDataExportAlertEmail } from "./data-export-email-template";

export async function emailPlatformAdminsAboutDataExport(input: {
  organizationName: string;
  requesterName: string;
  requesterEmail: string | null;
  reason: string;
  deliveryMethod: "DOWNLOAD" | "EMAIL";
  deliveryEmail: string | null;
  requestedAt: Date;
}) {
  const admins = await prisma.user.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      platformRole: { in: ["SUPER_ADMIN", "PLATFORM_ADMIN"] },
      email: { not: null },
    },
    select: { email: true },
  });
  const recipients = [...new Set(admins.flatMap((admin) => admin.email ? [admin.email] : []))];
  if (recipients.length === 0) return { recipientCount: 0, deliveredCount: 0, failedCount: 0 };

  const email = buildDataExportAlertEmail({ ...input, reviewUrl: absoluteUrl("/platform/data-management") });
  const deliveries = await Promise.allSettled(
    recipients.map((to) => sendTransactionalEmail(to, email.subject, email.text)),
  );
  const deliveredCount = deliveries.filter((delivery) => delivery.status === "fulfilled").length;
  const failedCount = deliveries.length - deliveredCount;
  if (failedCount > 0) {
    console.error("[data-export-alert] Failed to email some platform admins", { failedCount });
  }
  return { recipientCount: recipients.length, deliveredCount, failedCount };
}
