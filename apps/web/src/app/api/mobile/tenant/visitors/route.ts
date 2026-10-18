import { prisma } from "@/lib/prisma";
import { mobileJson } from "@/lib/mobile/api";
import { nativeRoute, nativeBody } from "@/lib/mobile/route";
import { mobileVisitorInputSchema } from "@estatedesk/contracts/mobile";
import { createVisitorPass, revokeVisitorPass } from "@/features/visitors/actions";
import { visitorPassState } from "@/features/visitors/policy";
export async function GET(request: Request) {
  return nativeRoute(request, async session => {
    const passes = await prisma.visitorPass.findMany({ where: { orgId: session.activeOrgId!, tenantUserId: session.userId }, orderBy: { createdAt: "desc" }, take: 100 });
    return mobileJson(passes.map(p => ({ id: p.id, visitorName: p.visitorName, validFrom: p.validFrom.toISOString(), validUntil: p.validUntil.toISOString(), status: visitorPassState(p) })));
  }, { role: "TENANT" });
}
export async function POST(request: Request) {
  return nativeRoute(request, async () => {
    const input = await nativeBody(request, mobileVisitorInputSchema);
    if (input.action !== "create" && input.action !== "revoke") return mobileJson({ error: "Invalid tenant action." }, 400);
    const form = new FormData();
    for (const [key, value] of Object.entries(input)) form.set(key, value);
    const result = input.action === "create" ? await createVisitorPass({}, form) : await revokeVisitorPass({}, form);
    return mobileJson(result, result.error ? 400 : 200);
  }, { role: "TENANT" });
}
