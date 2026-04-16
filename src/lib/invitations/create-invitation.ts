import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendInviteEmail } from "@/lib/notifications/email";
import { sendInviteWhatsapp } from "@/lib/whatsapp/send-invite-whatsapp";

type CreateInvitationInput = {
  orgId: string;
  invitedById: string;
  email: string;
  phone?: string;
  role: "ADMIN" | "MANAGER" | "OFFICE" | "ACCOUNTANT" | "CARETAKER" | "TENANT";
  scopeType?: "ORG" | "PROPERTY" | "BUILDING" | "UNIT";
  scopeId?: string;
  orgName: string;
};

export async function createInvitation(input: CreateInvitationInput) {
  const email = input.email.trim().toLowerCase();
  const phone = input.phone?.trim() || null;

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invitation = await prisma.invitation.create({
    data: {
      orgId: input.orgId,
      invitedById: input.invitedById,
      email,
      phone,
      role: input.role,
      scopeType: input.scopeType ?? "ORG",
      scopeId: input.scopeId ?? "ORG_SCOPE",
      token,
      expiresAt,
      status: "PENDING",
    },
  });

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";
  const inviteUrl = `${appUrl}/accept-invite?token=${token}`;

  const emailResult = await Promise.allSettled([
    sendInviteEmail({
      to: email,
      orgName: input.orgName,
      role: input.role,
      inviteUrl,
    }),
    phone
      ? sendInviteWhatsapp({
          phone,
          orgName: input.orgName,
          role: input.role,
          inviteUrl,
        })
      : Promise.resolve(null),
  ]);

  const [emailSend, whatsappSend] = emailResult;

  await prisma.invitation.update({
    where: {
      id: invitation.id,
    },
    data: {
      emailSentAt: emailSend.status === "fulfilled" ? new Date() : null,
      whatsappSentAt:
        phone && whatsappSend.status === "fulfilled" ? new Date() : null,
      deliveryMeta: {
        email:
          emailSend.status === "fulfilled"
            ? { status: "sent" }
            : { status: "failed", error: String(emailSend.reason) },
        whatsapp: !phone
          ? { status: "skipped" }
          : whatsappSend.status === "fulfilled"
          ? { status: "sent", response: whatsappSend.value }
          : { status: "failed", error: String(whatsappSend.reason) },
      },
    },
  });

  return {
    invitationId: invitation.id,
    inviteUrl,
  };
}