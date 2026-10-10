"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { isMpesaStkConfigured } from "@/lib/payments/method-flow";
import { parsePaymentInstructions } from "@/lib/payments/instructions";

export async function getTenantPaymentInstructions() {
  const session = await requireTenantAccess();

  if (!session.activeOrgId) {
    throw new Error("Missing tenant session context.");
  }

  const settings = await prisma.organizationSettings.findUnique({
    where: { orgId: session.activeOrgId },
    select: {
      customFields: true,
    },
  });

  return { ...parsePaymentInstructions(settings?.customFields), mpesaStkEnabled: isMpesaStkConfigured(session.activeOrgId) };
}