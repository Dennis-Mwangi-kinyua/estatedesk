"use server";

import { NotificationChannel, NotificationType, OrgRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logServerError } from "@/lib/errors/server-error-log";
import { prisma } from "@/lib/prisma";
import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { notifyRecipients } from "@/lib/notifications/notify";
import { sendMetaWhatsappText } from "@/lib/whatsapp/meta";
import { getCaretakerIssueHref } from "@/app/(app)/dashboard/caretaker/_lib/paths";
import { getCaretakerManageableIssue } from "@/app/(app)/dashboard/caretaker/issues/_lib/access";

const VENDORS_PATH = "/dashboard/caretaker/vendors";

export async function dispatchCaretakerVendorAction(formData: FormData) {
  const session = await requireCaretakerAccess();
  const issueId = String(formData.get("issueId") ?? "").trim();
  const vendorId = String(formData.get("vendorId") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!issueId || !vendorId) {
    redirect(VENDORS_PATH);
  }

  const issue = await getCaretakerManageableIssue({
    orgId: session.activeOrgId!,
    caretakerUserId: session.userId,
    membershipScope: session.membershipScope,
    issueId,
  });

  if (!issue) {
    redirect(VENDORS_PATH);
  }

  const vendor = await prisma.accountingVendor.findFirst({
    where: {
      id: vendorId,
      orgId: session.activeOrgId!,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      contactPerson: true,
    },
  });

  if (!vendor) {
    redirect(VENDORS_PATH);
  }

  const officeRecipients = await prisma.membership.findMany({
    where: {
      orgId: session.activeOrgId!,
      role: { in: [OrgRole.OFFICE, OrgRole.ADMIN] },
      user: { deletedAt: null },
    },
    distinct: ["userId"],
    select: { userId: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.auditLog.create({
      data: {
        orgId: session.activeOrgId!,
        actorUserId: session.userId,
        action: "CARETAKER_VENDOR_DISPATCH",
        entityType: "IssueTicket",
        entityId: issue.id,
        metadata: {
          vendorId: vendor.id,
          vendorName: vendor.name,
          vendorPhone: vendor.phone,
          vendorEmail: vendor.email,
          notes: notes || null,
          source: "caretaker_portal",
        },
      },
    });

    await notifyRecipients({
      db: tx,
      orgId: session.activeOrgId!,
      recipients: officeRecipients.map((recipient) => ({
        userId: recipient.userId,
      })),
      channels: [NotificationChannel.IN_APP],
      type: NotificationType.GENERAL,
      title: "Vendor dispatch requested",
      message: `Caretaker requested ${vendor.name} for issue "${issue.title}".${
        notes ? ` Notes: ${notes}` : ""
      }`,
      actionUrl: getCaretakerIssueHref(issue.id),
    });
  });

  if (vendor.phone) {
    try {
      await sendMetaWhatsappText({
        to: vendor.phone,
        body: `EstateDesk maintenance request: "${issue.title}".${
          notes ? ` Notes: ${notes}` : ""
        } Please coordinate with the property office.`,
      });
    } catch (error) {
      logServerError("caretakerVendorWhatsapp", error, { vendorId: vendor.id });
    }
  }

  revalidatePath(VENDORS_PATH);
  revalidatePath(getCaretakerIssueHref(issue.id));
  revalidatePath("/dashboard/org/notifications");
  redirect(getCaretakerIssueHref(issue.id));
}