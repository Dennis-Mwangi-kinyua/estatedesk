import { prisma } from "@/lib/prisma";
import { publicJobWhere } from "@/features/recruitment/service";
import { APP_URL, XML_HEADERS, buildUrlEntry, wrapUrlset } from "@/lib/sitemap-utils";
export const dynamic = "force-dynamic";
export async function GET() {
  const jobs = await prisma.recruitmentJob.findMany({ where: publicJobWhere(), select: { slug: true, updatedAt: true }, take: 50000, orderBy: { id: "asc" } });
  return new Response(wrapUrlset(jobs.map(job => buildUrlEntry({ loc: `${APP_URL}/careers/${job.slug}`, lastmod: job.updatedAt.toISOString().slice(0, 10), changefreq: "daily", priority: "0.6" })).join("\n")), { headers: XML_HEADERS });
}
