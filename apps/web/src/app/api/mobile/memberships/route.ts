import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { switchActiveMembership } from "@/lib/auth/session";
import { mobileJson } from "@/lib/mobile/api";
import { nativeRoute, nativeBody } from "@/lib/mobile/route";

export async function GET(request: Request) {
  return nativeRoute(request, async session => {
    const memberships = await prisma.membership.findMany({
      where: { userId: session.userId, employmentEndedAt: null, deactivatedAt: null, org: { deletedAt: null, status: "ACTIVE" } },
      select: { id: true, orgId: true, role: true, org: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    });
    return mobileJson(memberships.map(item => ({ id: item.id, organizationId: item.orgId, organizationName: item.org.name, role: item.role })));
  });
}

export async function POST(request: Request) {
  return nativeRoute(request, async session => {
    const { membershipId } = await nativeBody(request, z.object({ membershipId: z.string().min(1).max(200) }));
    const owned = await prisma.membership.findFirst({ where: { id: membershipId, userId: session.userId, deactivatedAt: null, employmentEndedAt: null, org: { status: "ACTIVE", deletedAt: null } }, select: { id: true } });
    if (!owned) return mobileJson({ error: "Organization membership unavailable." }, 403);
    await switchActiveMembership(owned.id);
    return mobileJson({ ok: true });
  });
}
