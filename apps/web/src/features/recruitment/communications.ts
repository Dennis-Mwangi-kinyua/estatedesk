import "server-only";
import { prisma } from "@/lib/prisma";
import type { AppSession } from "@/lib/auth/session";
import { hiringOrgId, type HiringScope } from "./scope";
import { check } from "./policy";
import { stageMessageKinds } from "./communication-policy";

export async function approveCommunication(session: AppSession, scope: HiringScope, id: string, version: string, subject: string, body: string) {
  const orgId = hiringOrgId(session, scope);
  check(Number.isFinite(Date.parse(version)), "Refresh the message before approving.");
  check(subject.trim().length >= 3 && subject.length <= 200 && !/[\r\n]/.test(subject) && body.trim().length >= 30 && body.length <= 8000, "Provide a subject and a complete candidate message.");
  await prisma.$transaction(async tx => {
    const message = await tx.recruitmentCommunication.findFirst({ where: { id, job: { orgId }, status: "DRAFT", updatedAt: new Date(version) }, include: { application: true, job: { include: { org: true } } } });
    check(message?.application, "Message changed or is unavailable. Refresh before approving.");
    const application = message.application;
    check(application.jobId === message.jobId, "Message is not associated with this advertisement.");
    check(!message.job.org || (message.job.org.status === "ACTIVE" && !message.job.org.deletedAt && !message.job.org.blacklistedAt), "This employer is unavailable.");
    check(message.expectedVersion?.getTime() === application.updatedAt.getTime() && stageMessageKinds[application.status] === message.kind, "The candidate stage or appointment changed. Use the latest draft.");
    const now = new Date();
    if (message.kind === "INTERVIEW") check(message.interviewAt && message.interviewAt > now, "Update the interview appointment before sending.");
    const claimed = await tx.recruitmentCommunication.updateMany({ where: { id, status: "DRAFT", updatedAt: new Date(version) }, data: { subject: subject.trim(), body: body.trim(), status: "QUEUED", approvedAt: now, approvedByUserId: session.userId, scheduledAt: now } });
    check(claimed.count === 1, "Message already approved or changed.");
    // Only approved invitations schedule a reminder. Short-notice interviews get the invitation only.
    if (message.kind === "INTERVIEW" && message.interviewAt && message.interviewAt.getTime() - 86400000 > now.getTime()) {
      const reminder = { subject: `Reminder: ${subject.trim()}`, body: `Interview reminder\n\n${body.trim()}` };
      await tx.recruitmentCommunication.createMany({ data: [{ jobId: message.jobId, applicationId: application.id, dedupeKey: `reminder:${message.id}`, kind: "INTERVIEW_REMINDER", recipient: application.email, ...reminder, status: "QUEUED", expectedVersion: application.updatedAt, interviewEventId: message.interviewEventId, interviewAt: message.interviewAt, scheduledAt: new Date(message.interviewAt.getTime() - 86400000), approvedAt: now, approvedByUserId: session.userId }], skipDuplicates: true });
    }
    await tx.auditLog.create({ data: { orgId, actorUserId: session.userId, action: "RECRUITMENT_MESSAGE_APPROVED", entityType: "Recruitment", entityId: id, metadata: { kind: message.kind } } });
  }, { isolationLevel: "Serializable" });
}

export async function cancelCommunication(session: AppSession, scope: HiringScope, id: string) {
  const orgId = hiringOrgId(session, scope);
  await prisma.$transaction(async tx => {
    const message = await tx.recruitmentCommunication.findFirst({ where: { id, job: { orgId } }, select: { kind: true, applicationId: true, interviewEventId: true } });
    const changed = await tx.recruitmentCommunication.updateMany({ where: { id, job: { orgId }, status: { in: ["DRAFT", "QUEUED", "FAILED"] } }, data: { status: "CANCELLED" } });
    check(changed.count === 1, "Message is unavailable or already handed to the email provider.");
    if (message?.kind === "INTERVIEW") await tx.recruitmentCommunication.updateMany({ where: { applicationId: message.applicationId, interviewEventId: message.interviewEventId, kind: "INTERVIEW_REMINDER", status: { in: ["DRAFT", "QUEUED", "FAILED"] } }, data: { status: "CANCELLED", lastError: "Interview invitation cancelled by the hiring team." } });
    await tx.auditLog.create({ data: { orgId, actorUserId: session.userId, action: "RECRUITMENT_MESSAGE_CANCELLED", entityType: "Recruitment", entityId: id } });
  });
}
