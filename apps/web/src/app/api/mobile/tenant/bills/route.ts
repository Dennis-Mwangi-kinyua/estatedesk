import { getTenantInvoiceData } from "@/app/(app)/dashboard/tenant/invoice/_lib/queries";
import { isNativeRequest, mobileError, mobileJson, mobileSession } from "@/lib/mobile/api";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import type { MobileBills } from "@estatedesk/contracts/mobile";

export async function GET(request: Request) {
  if (!isNativeRequest(request)) return mobileJson({ error: "Native client required." }, 403);
  try {
    const session = await mobileSession();
    if (session instanceof Response) return session;
    if (session.mustChangePassword || session.requiresTermsAcceptance) {
      return mobileJson({ error: "Complete your account setup on the website first." }, 403);
    }
    await requireTenantAccess();
    const orgId = session.activeOrgId!;
    // The web invoice page requires an active lease. Its pathname-based guard
    // does not recognize API paths, so enforce the same rule here explicitly.
    const lease = await prisma.lease.findFirst({
      where: {
        orgId, status: "ACTIVE", deletedAt: null,
        tenant: { userId: session.userId, deletedAt: null },
      },
      select: { id: true },
    });
    if (!lease) return mobileJson({ error: "An active lease is required to view current bills." }, 403);
    const [data, org] = await Promise.all([
      getTenantInvoiceData(session.userId, orgId, session.fullName),
      prisma.organization.findUniqueOrThrow({ where: { id: orgId }, select: { currencyCode: true } }),
    ]);
    // Return only display fields; never serialize the Prisma tenant graph.
    const result: MobileBills = {
      organizationName: data.organizationName,
      currencyCode: org.currencyCode,
      totalBalance: data.totalBalance,
      bills: data.bills.map(bill => ({
        id: bill.id, label: bill.typeLabel, period: bill.period,
        dueDate: bill.dueDate.toISOString(), amountDue: bill.amountDue,
        balance: bill.balance, status: bill.status, source: bill.source,
      })),
    };
    return mobileJson(result);
  } catch (error) { return mobileError(error); }
}
