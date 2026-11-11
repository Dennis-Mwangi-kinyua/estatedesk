import "server-only";
import { prisma } from "@/lib/prisma";
import type { AppSession } from "@/lib/auth/session";
import { hiringOrgId, type HiringScope } from "./scope";
import { applicationStages, applicationSources } from "./policy";

export async function recruitmentReport(session: AppSession, scope: HiringScope, jobId?: string, now = new Date()) {
  const orgId = hiringOrgId(session, scope);
  const since = new Date(now.getTime() - 90 * 86400000);
  const where = { job: { orgId, ...(jobId ? { id: jobId } : {}) }, createdAt: { gte: since, lte: now } };
  const [applications, total] = await Promise.all([
    prisma.recruitmentApplication.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 5000, select: { source: true, status: true, createdAt: true, events: { select: { toStatus: true, createdAt: true }, orderBy: { createdAt: "asc" } } } }),
    prisma.recruitmentApplication.count({ where }),
  ]);
  const reached = Object.fromEntries(applicationStages.map(stage => [stage, 0]));
  const exits = Object.fromEntries(applicationStages.filter(stage => !["HIRED", "REJECTED", "WITHDRAWN"].includes(stage)).map(stage => [stage, 0]));
  const sources = Object.fromEntries(applicationSources.map(source => [source, 0]));
  const hireDays: number[] = [];
  for (const application of applications) {
    sources[application.source] = (sources[application.source] ?? 0) + 1;
    const stages = new Set(["SUBMITTED", application.status, ...application.events.map(event => event.toStatus)]);
    for (const stage of stages) reached[stage] = (reached[stage] ?? 0) + 1;
    const hire = application.events.find(event => event.toStatus === "HIRED");
    if (hire) hireDays.push(Math.max(0, (hire.createdAt.getTime() - application.createdAt.getTime()) / 86400000));
    let previous = "SUBMITTED";
    for (const event of application.events) {
      if (["REJECTED", "WITHDRAWN"].includes(event.toStatus) && previous in exits) exits[previous]++;
      previous = event.toStatus;
    }
  }
  return { total, sampled: applications.length, capped: total > applications.length, since, reached, exits, sources, hires: hireDays.length, averageHireDays: hireDays.length ? hireDays.reduce((a, b) => a + b, 0) / hireDays.length : null };
}
