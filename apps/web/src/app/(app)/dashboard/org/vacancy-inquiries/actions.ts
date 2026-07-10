"use server";

import { revalidatePath } from "next/cache";
import { requireOrgRole } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/security";

const INQUIRIES_PATH = "/dashboard/org/vacancy-inquiries";

const ALLOWED_STATUSES = new Set([
  "NEW",
  "CONTACTED",
  "VIEWING_SCHEDULED",
  "CONVERTED",
  "CLOSED",
]);

export async function updateVacancyInquiryStatusAction(formData: FormData) {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE"], {
    redirectTo: "/dashboard",
  });

  const inquiryId = String(formData.get("inquiryId") ?? "");
  const status = String(formData.get("status") ?? "").toUpperCase();

  if (!session.activeOrgId || !inquiryId || !ALLOWED_STATUSES.has(status)) {
    return;
  }

  const inquiry = await prisma.vacancyInquiry.findFirst({
    where: {
      id: inquiryId,
      orgId: session.activeOrgId,
    },
    select: {
      id: true,
      status: true,
      unitId: true,
      fullName: true,
    },
  });

  if (!inquiry || inquiry.status === status) {
    return;
  }

  await prisma.vacancyInquiry.update({
    where: {
      id: inquiry.id,
    },
    data: {
      status,
    },
  });

  await writeAuditLog({
    orgId: session.activeOrgId,
    actorUserId: session.userId,
    action: "VACANCY_INQUIRY_STATUS_UPDATED",
    entityType: "VacancyInquiry",
    entityId: inquiry.id,
    beforeState: {
      status: inquiry.status,
    },
    afterState: {
      status,
    },
    metadata: {
      unitId: inquiry.unitId,
      fullName: inquiry.fullName,
    },
  });

  revalidatePath(INQUIRIES_PATH);
  revalidatePath("/dashboard/org");
}
