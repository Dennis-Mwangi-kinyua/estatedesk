import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { organizationPurgeWhere, purgeOrganization } from "@/lib/data-retention/organization-deletion";
import { cleanOrganizationFiles } from "@/lib/data-retention/organization-files";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET ? Buffer.from(`Bearer ${process.env.CRON_SECRET}`) : null;
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  if (!expected || actual.length !== expected.length || !timingSafeEqual(actual, expected)) return new Response("Unauthorized", { status: 401 });
  const now = new Date();
  const organizations = await prisma.organization.findMany({ where: organizationPurgeWhere(now), orderBy: { deletedAt: "asc" }, take: 3, select: { id: true } });
  let purged = 0, pending = 0, failed = 0;
  const deadline = Date.now() + 200000;
  for (const org of organizations) {
    if (Date.now() >= deadline) { pending++; continue; }
    try {
      let filesReady = false;
      do { filesReady = await cleanOrganizationFiles(prisma, org.id, now); }
      while (!filesReady && Date.now() < deadline);
      if (!filesReady) { pending++; continue; }
      if (await purgeOrganization(prisma, org.id, now)) purged++;
    } catch (error) {
      failed++;
      console.error("Organization retention cleanup failed", { orgId: org.id, code: error && typeof error === "object" && "code" in error ? error.code : "CLEANUP_FAILED" });
    }
  }
  return Response.json({ checked: organizations.length, purged, pending, failed }, { status: failed ? 503 : 200 });
}
