"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgPermission } from "@/lib/permissions/guards";
import { backfillInitialCharges } from "@/lib/billing/backfill-initial-charges";
import { safeServerActionError } from "@/lib/errors/server-error-log";

export async function backfillTenantChargesAction(tenantId: string) {
  try {
    const session = await requireOrgPermission("payments.verify");
    const tenant = await prisma.tenant.findFirstOrThrow({ where: { id: tenantId, orgId: session.activeOrgId!, deletedAt: null }, select: { slug: true } });
    const leases = await prisma.lease.findMany({ where: { tenantId, orgId: session.activeOrgId! }, select: { id: true } });
    const results = [];
    for (const lease of leases) {
      results.push(await prisma.$transaction(tx => backfillInitialCharges(tx, lease.id, true, session.userId), { isolationLevel: "Serializable", timeout: 15_000 }));
    }
    revalidatePath(`/dashboard/org/tenants/${tenant.slug ?? tenantId}`);
    revalidatePath("/dashboard/org/charges");
    revalidatePath("/dashboard/tenant", "layout");
    return { status: "success" as const, message: `${results.filter(item => item.status === "created").length} tenancies updated. ${results.filter(item => item.status === "review").length} require review of payment or move-out history before adding charges.` };
  } catch (error) {
    return { status: "error" as const, message: safeServerActionError("backfillTenantChargesAction", error, "Could not backfill charges. Refresh and try again.") };
  }
}
