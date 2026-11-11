import "server-only";
import { prisma } from "@/lib/prisma";
import { sendTransactionalEmail } from "@/lib/notifications/email";
import { stageMessageKinds } from "./communication-policy";

export async function queueClosingReminders(now = new Date()) {
  const ids = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT j.id FROM "RecruitmentJob" j LEFT JOIN "Organization" o ON o.id=j."orgId"
    JOIN "User" u ON u.id=j."createdByUserId"
    WHERE j.status='OPEN' AND j."closesAt">${now} AND j."closesAt"<=${new Date(now.getTime() + 48 * 3600000)}
    AND u.email IS NOT NULL AND (j."orgId" IS NULL OR (o.status='ACTIVE' AND o."deletedAt" IS NULL AND o."blacklistedAt" IS NULL))
    AND NOT EXISTS (SELECT 1 FROM "RecruitmentCommunication" c WHERE c."jobId"=j.id AND c.kind='CLOSING_REMINDER' AND c."deadlineAt"=j."closesAt")
    ORDER BY j."closesAt", j.id LIMIT 100`;
  const jobs = await prisma.recruitmentJob.findMany({ where: { id: { in: ids.map(value => value.id) } }, include: { createdBy: { select: { email: true } } } });
  const result = await prisma.recruitmentCommunication.createMany({ data: jobs.filter(job => job.createdBy.email).map(job => ({
    jobId: job.id, dedupeKey: `closing:${job.id}:${job.closesAt.toISOString()}`, kind: "CLOSING_REMINDER", recipient: job.createdBy.email!, status: "QUEUED", deadlineAt: job.closesAt,
    subject: `Closing soon: ${job.title}`, body: `Your advertisement “${job.title}” closes on ${new Intl.DateTimeFormat("en-KE", { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Nairobi" }).format(job.closesAt)} (Africa/Nairobi, UTC+03:00).\nReview pending applications and update the deadline if needed in your recruitment workspace.`, scheduledAt: now,
  })), skipDuplicates: true });
  return result.count;
}

/** The sender is injectable so verification never sends real candidate emails. */
export async function deliverRecruitmentMessages(options: { now?: Date; send?: typeof sendTransactionalEmail; limit?: number } = {}) {
  const now = options.now ?? new Date();
  const send = options.send ?? sendTransactionalEmail;
  // Recover a crashed claim within the provider's idempotency window.
  await prisma.recruitmentCommunication.updateMany({ where: { status: "SENDING", lockedAt: { lt: new Date(now.getTime() - 15 * 60000) } }, data: { status: "QUEUED", lockedAt: null } });
  const messages = await prisma.recruitmentCommunication.findMany({ where: { status: "QUEUED", scheduledAt: { lte: now } }, orderBy: [{ scheduledAt: "asc" }, { id: "asc" }], take: Math.min(50, Math.max(1, options.limit ?? 20)), select: { id: true, attempts: true, firstAttemptAt: true } });
  const result = { accepted: 0, failed: 0, cancelled: 0 };
  for (const candidate of messages) {
    const claim = await prisma.recruitmentCommunication.updateMany({ where: { id: candidate.id, status: "QUEUED", attempts: candidate.attempts, scheduledAt: { lte: now } }, data: { status: "SENDING", lockedAt: now, firstAttemptAt: candidate.firstAttemptAt ?? now, attempts: { increment: 1 } } });
    if (!claim.count) continue;
    const message = await prisma.recruitmentCommunication.findUnique({ where: { id: candidate.id }, include: { job: { include: { org: true, createdBy: { select: { email: true } } } }, application: { include: { events: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1 } } } } });
    if (!message) continue;
    const application = message.application;
    const org = message.job.org;
    const candidateStage = message.kind === "INTERVIEW_REMINDER" ? "INTERVIEW" : application ? stageMessageKinds[application.status] : undefined;
    const valid = (message.kind === "CLOSING_REMINDER" || application?.jobId === message.jobId)
      && (!org || (org.status === "ACTIVE" && !org.deletedAt && !org.blacklistedAt))
      && (message.kind === "RECEIPT" || message.kind === "CLOSING_REMINDER" || !!message.approvedAt)
      && (!message.expectedVersion || application?.updatedAt.getTime() === message.expectedVersion.getTime())
      && (message.kind === "RECEIPT" || message.kind === "CLOSING_REMINDER" || candidateStage === (message.kind === "INTERVIEW_REMINDER" ? "INTERVIEW" : message.kind))
      && (!message.interviewAt || (message.interviewAt > now && application?.events[0]?.id === message.interviewEventId))
      && (message.kind !== "CLOSING_REMINDER" || (message.job.status === "OPEN" && message.job.closesAt > now && message.job.closesAt.getTime() === message.deadlineAt?.getTime() && message.recipient === message.job.createdBy.email));
    if (!valid) {
      await prisma.recruitmentCommunication.updateMany({ where: { id: message.id, status: "SENDING", lockedAt: now }, data: { status: "CANCELLED", lockedAt: null, lastError: "Candidate, appointment or employer changed before delivery." } }); result.cancelled++; continue;
    }
    if (message.kind === "INTERVIEW_REMINDER") {
      const invitation = await prisma.recruitmentCommunication.findFirst({ where: { applicationId: message.applicationId, interviewEventId: message.interviewEventId, kind: "INTERVIEW" }, select: { status: true } });
      if (invitation?.status !== "ACCEPTED") {
        await prisma.recruitmentCommunication.updateMany({ where: { id: message.id, status: "SENDING", lockedAt: now }, data: { status: invitation && ["QUEUED", "SENDING"].includes(invitation.status) ? "QUEUED" : "CANCELLED", lockedAt: null, attempts: { decrement: 1 }, firstAttemptAt: candidate.firstAttemptAt, scheduledAt: new Date(now.getTime() + 5 * 60000), lastError: "Waiting for the approved interview invitation to be accepted by the provider." } });
        continue;
      }
    }
    if (message.attempts > 5 || (message.attempts > 1 && now.getTime() - (message.firstAttemptAt ?? now).getTime() > 20 * 3600000)) {
      await prisma.recruitmentCommunication.updateMany({ where: { id: message.id, status: "SENDING", lockedAt: now }, data: { status: "FAILED", lockedAt: null, lastError: "Automatic retry window ended. Confirm delivery with the candidate before contacting them again." } }); result.failed++; continue;
    }
    try {
      await send(message.recipient, message.subject, message.body, undefined, { idempotencyKey: `recruitment-${message.id}` });
      await prisma.recruitmentCommunication.updateMany({ where: { id: message.id, status: "SENDING", lockedAt: now }, data: { status: "ACCEPTED", acceptedAt: now, lockedAt: null, lastError: null } }); result.accepted++;
    } catch {
      await prisma.recruitmentCommunication.updateMany({ where: { id: message.id, status: "SENDING", lockedAt: now }, data: { status: message.attempts >= 5 ? "FAILED" : "QUEUED", scheduledAt: new Date(now.getTime() + Math.min(60, 5 * 2 ** (message.attempts - 1)) * 60000), lockedAt: null, lastError: "Email provider unavailable or delivery was not confirmed. Check email configuration and retry history." } }); result.failed++;
    }
  }
  return result;
}
