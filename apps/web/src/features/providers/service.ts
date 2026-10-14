import "server-only";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "./policy";
const publicProvider = { status: "ACTIVE" as const, user: { status: "ACTIVE" as const, deletedAt: null } };
export const visibleProviderWhere = publicProvider;
export async function applyForJob(providerId: string, jobId: string, message: string) {
  return prisma.$transaction(async tx => {
    // Both hiring and moderation update this row; application eligibility cannot race either.
    const locked = await tx.serviceProvider.updateMany({ where: { id: providerId, ...publicProvider, available: true }, data: { updatedAt: new Date() } });
    if (!locked.count) throw new Error("This provider is not available for new work.");
    const open = await tx.serviceJob.updateMany({ where: { id: jobId, status: "OPEN", org: { status: "ACTIVE", deletedAt: null } }, data: { updatedAt: new Date() } });
    if (!open.count) throw new Error("This job is no longer open.");
    return tx.jobApplication.upsert({ where: { jobId_providerId: { jobId, providerId } }, create: { jobId, providerId, message }, update: { message } });
  });
}
export async function hireProvider(orgId: string, jobId: string, providerId: string) {
  return prisma.$transaction(async tx => {
    const eligible = await tx.serviceProvider.updateMany({ where: { id: providerId, ...publicProvider, available: true }, data: { updatedAt: new Date() } });
    if (!eligible.count) throw new Error("This provider is not available for hire.");
    const hired = await tx.serviceJob.updateMany({ where: { id: jobId, orgId, status: "OPEN" }, data: { providerId, status: "ASSIGNED" } });
    if (!hired.count) throw new Error("Job not found in your organisation, or it has already been assigned.");
  });
}
export async function confirmAndReview(orgId: string, jobId: string, input: { rating: number; comment: string }) {
  const data = reviewSchema.parse(input);
  return prisma.$transaction(async tx => {
    const changed = await tx.serviceJob.updateMany({ where: { id: jobId, orgId, status: "SUBMITTED", providerId: { not: null } }, data: { status: "COMPLETED", completedAt: new Date() } });
    if (!changed.count) throw new Error("Only submitted work in your organisation can be confirmed and rated.");
    const job = await tx.serviceJob.findUniqueOrThrow({ where: { id: jobId }, select: { providerId: true } });
    return tx.providerReview.create({ data: { jobId, providerId: job.providerId!, ...data } });
  });
}
export async function reportProvider(orgId: string, jobId: string, reason: string) {
  const job = await prisma.serviceJob.findFirst({ where: { id: jobId, orgId, providerId: { not: null } } });
  if (!job) throw new Error("Only providers hired by your organisation can be reported.");
  return prisma.providerReport.upsert({ where: { orgId_jobId: { orgId, jobId } }, create: { orgId, jobId, providerId: job.providerId!, reason }, update: { reason, resolvedAt: null, resolvedByUserId: null, resolution: null } });
}
