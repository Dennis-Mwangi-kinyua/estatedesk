import { notFound } from "next/navigation";
import { decodePublicId } from "@/lib/public-id";
import type { AppSession } from "@/lib/auth/session";
import { getCaretakerManageableIssue } from "@/app/(app)/dashboard/caretaker/issues/_lib/access";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { prisma } from "@/lib/prisma";
import { VENDORS_LOAD_ERROR_MESSAGE } from "./helpers";

export async function getCaretakerVendorsData({ orgId }: { orgId: string }) {
  try {
    const vendors = await retryTransientDatabaseOperation(
      () =>
        prisma.accountingVendor.findMany({
          where: {
            orgId,
            isActive: true,
          },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            contactPerson: true,
            phone: true,
            email: true,
          },
        }),
      { label: "caretaker vendors page data" },
    );

    return {
      ok: true as const,
      vendors,
    };
  } catch {
    return {
      ok: false as const,
      errorMessage: VENDORS_LOAD_ERROR_MESSAGE,
      vendors: [],
    };
  }
}
export async function getCaretakerVendorPageData(session: AppSession, publicIssueId?: string) {
  const issueId = publicIssueId ? decodePublicId(publicIssueId, "issue") : undefined;
  if (issueId) {
    const issue = await getCaretakerManageableIssue({ orgId: session.activeOrgId!, caretakerUserId: session.userId, membershipScope: session.membershipScope, issueId });
    if (!issue || issue.assignedToUserId !== session.userId || issue.status !== "IN_PROGRESS") notFound();
  }
  return { data: await getCaretakerVendorsData({ orgId: session.activeOrgId! }), issueId };
}
