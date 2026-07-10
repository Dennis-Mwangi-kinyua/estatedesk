import "server-only";

import crypto from "node:crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { throwSafeActionFailure } from "@/lib/errors/server-error-log";
import { prisma } from "@/lib/prisma";
import { notifyInAppAndPush } from "@/lib/notifications/notify";
import { absoluteUrl } from "@/lib/seo";
import { storage } from "@/lib/storage";
import type { LeaseSignerRole, LeaseSigningJurisdiction, LeaseSigningOrder, LeaseSignatureMethod } from "@prisma/client";

export const LEASE_CONSENT_VERSION = "2026-07-02";
export const LEASE_CONSENT: Record<LeaseSigningJurisdiction, string> = {
  KENYA: "I have reviewed this lease and intend to sign it electronically. I consent to EstateDesk linking my authenticated account, signature representation, timestamp, IP address, device information and the document SHA-256 hash as evidence of my approval. I understand this native EstateDesk signature is not represented as a certified advanced electronic signature.",
  UAE: "I have reviewed this lease and intend to sign it electronically. I consent to EstateDesk linking my authenticated account, signature representation, timestamp, IP address, device information and the document SHA-256 hash as evidence of my approval. I understand this native EstateDesk signature is not a Qualified Electronic Signature issued by a UAE Qualified Trust Service Provider.",
};
const tokenHash = (token: string) => crypto.createHash("sha256").update(token).digest("hex");
const newToken = () => crypto.randomBytes(32).toString("base64url");

async function assetBytes(key: string) {
  if (/^https?:\/\//.test(key)) {
    const response = await fetch(key, { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to read the lease document.");
    return new Uint8Array(await response.arrayBuffer());
  }
  return storage.downloadFile(key);
}

export async function createLeaseSignatureEnvelope(input: {
  leaseId: string;
  orgId: string;
  createdByUserId: string;
  expiresInDays: number;
  message?: string | null;
  jurisdiction?: LeaseSigningJurisdiction;
  signingOrder?: LeaseSigningOrder;
  additionalSigners?: Array<{ userId: string; role: Exclude<LeaseSignerRole, "ORGANIZATION">; label?: string }>;
  amendment?: boolean;
}) {
  const lease = await prisma.lease.findFirst({
    where: { id: input.leaseId, orgId: input.orgId, deletedAt: null },
    include: { org: true, tenant: { include: { user: true } }, contractDocument: true },
  });
  if (!lease?.contractDocument) throw new Error("Upload a PDF lease contract before requesting signatures.");
  if (lease.contractDocument.mimeType !== "application/pdf") throw new Error("Online signing currently requires a PDF lease contract.");
  if (!lease.tenant.userId) throw new Error("The tenant needs a linked EstateDesk user account before online signing.");
  const actor = await prisma.user.findUniqueOrThrow({ where: { id: input.createdByUserId } });
  const sourceAsset = lease.contractDocument;
  const bytes = await assetBytes(sourceAsset.key);
  const sourceDocumentHash = crypto.createHash("sha256").update(bytes).digest("hex");
  const organizationToken = newToken();
  const tenantToken = newToken();
  const jurisdiction = input.jurisdiction ?? "KENYA";
  const signingOrder = input.signingOrder ?? "SEQUENTIAL";
  const requestedAdditional = input.additionalSigners ?? [];
  const additionalUsers = await prisma.user.findMany({ where: { id: { in: requestedAdditional.map((item) => item.userId) }, status: "ACTIVE", OR: [{ memberships: { some: { orgId: lease.orgId, employmentEndedAt: null } } }, { tenant: { orgId: lease.orgId, deletedAt: null } }, { landlordProfiles: { some: { orgId: lease.orgId, isActive: true, deletedAt: null } } }] }, select: { id: true, fullName: true, email: true, phone: true } });
  if (additionalUsers.length !== new Set(requestedAdditional.map((item) => item.userId)).size) throw new Error("Every additional signer must have an active EstateDesk login.");
  const userMap = new Map(additionalUsers.map((user) => [user.id, user]));
  const extraTokens = requestedAdditional.map((item) => ({ item, user: userMap.get(item.userId)!, token: newToken() }));
  const latestCompleted = await prisma.leaseSignatureEnvelope.findFirst({ where: { leaseId: lease.id, status: "COMPLETED" }, orderBy: { version: "desc" } });
  if (latestCompleted?.finalAssetId === sourceAsset.id) throw new Error("Upload a new or amended lease PDF before starting another signing round.");
  const latestVersion = await prisma.leaseSignatureEnvelope.aggregate({ where: { leaseId: lease.id }, _max: { version: true } });
  const expiresAt = new Date(Date.now() + Math.min(Math.max(input.expiresInDays, 1), 60) * 86_400_000);
  const envelope = await prisma.$transaction(async (tx) => {
    await tx.leaseSignatureEnvelope.updateMany({
      where: { leaseId: lease.id, status: { in: ["PENDING", "PARTIALLY_SIGNED"] } },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancellationReason: "Superseded by a new signing request." },
    });
    const created = await tx.leaseSignatureEnvelope.create({
      data: {
        orgId: lease.orgId, leaseId: lease.id, sourceAssetId: sourceAsset.id,
        sourceDocumentHash, expiresAt, message: input.message, consentVersion: LEASE_CONSENT_VERSION,
        jurisdiction, consentText: LEASE_CONSENT[jurisdiction], signingOrder,
        version: (latestVersion._max.version ?? 0) + 1, amendmentOfId: input.amendment ? latestCompleted?.id : null,
        createdByUserId: input.createdByUserId,
        signers: { create: [
          { role: "ORGANIZATION", signingOrder: 1, userId: actor.id, name: actor.fullName, email: actor.email, phone: actor.phone, tokenHash: tokenHash(organizationToken) },
          { role: "TENANT", signingOrder: signingOrder === "SEQUENTIAL" ? 2 : 1, userId: lease.tenant.userId, name: lease.tenant.fullName, email: lease.tenant.email, phone: lease.tenant.phone, tokenHash: tokenHash(tenantToken) },
          ...extraTokens.map(({ item, user, token }, index) => ({ role: item.role, signingOrder: signingOrder === "SEQUENTIAL" ? index + 3 : 1, label: item.label, userId: user.id, name: user.fullName, email: user.email, phone: user.phone, tokenHash: tokenHash(token) })),
        ] },
        events: { create: { eventType: "CREATED", actorUserId: input.createdByUserId, metadata: { sourceDocumentHash, expiresAt: expiresAt.toISOString() } } },
      },
    });
    await notifyInAppAndPush({
      db: tx, orgId: lease.orgId,
      recipients: [{ tenantId: lease.tenant.id, userId: lease.tenant.userId }],
      type: "GENERAL", title: "Lease signature requested",
      message: `${lease.org.name} requested your electronic signature. Review and sign: ${absoluteUrl(`/sign-lease/${tenantToken}`)}`,
    });
    for (const { item, user, token } of extraTokens) {
      await notifyInAppAndPush({ db: tx, orgId: lease.orgId, recipients: [{ userId: user.id }], type: "GENERAL", title: `Lease signature requested: ${item.role.toLowerCase()}`, message: `Review and sign: ${absoluteUrl(`/sign-lease/${token}`)}` });
    }
    return created;
  });
  return { envelope, organizationSigningUrl: `/sign-lease/${organizationToken}` };
}

export async function getLeaseSigningContext(token: string) {
  return prisma.leaseSignatureSigner.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: {
      envelope: { include: { org: { select: { name: true } }, lease: { include: { unit: { include: { property: true } }, tenant: true, contractDocument: true } }, signers: { orderBy: { role: "asc" } } } },
    },
  });
}

export async function recordLeaseSignatureView(signerId: string, envelopeId: string, ipAddress?: string | null, userAgent?: string | null) {
  const existing = await prisma.leaseSignatureEvent.findFirst({ where: { envelopeId, signerId, eventType: "VIEWED" }, select: { id: true } });
  if (!existing) await prisma.leaseSignatureEvent.create({ data: { envelopeId, signerId, eventType: "VIEWED", ipAddress, userAgent } });
}

async function finalizeEnvelope(envelopeId: string) {
  const envelope = await prisma.leaseSignatureEnvelope.findUniqueOrThrow({
    where: { id: envelopeId }, include: { signers: true, lease: { include: { contractDocument: true, unit: { include: { property: true } } } }, org: true },
  });
  if (envelope.status === "COMPLETED" || !envelope.signers.every((signer) => signer.status === "SIGNED")) return;
  const source = await assetBytes(envelope.lease.contractDocument!.key);
  const actualHash = crypto.createHash("sha256").update(source).digest("hex");
  if (actualHash !== envelope.sourceDocumentHash) throw new Error("The lease document changed after the signing request was created.");
  const pdf = await PDFDocument.load(source);
  const page = pdf.addPage([595.28, 841.89]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  page.drawText("ESTATEDESK ELECTRONIC SIGNING CERTIFICATE", { x: 48, y: 785, size: 16, font: bold, color: rgb(.05,.12,.2) });
  page.drawText(`Lease: ${envelope.lease.unit.property.name} / Unit ${envelope.lease.unit.houseNo}`, { x: 48, y: 750, size: 11, font: bold });
  page.drawText(`Envelope: ${envelope.id}`, { x: 48, y: 728, size: 9, font: regular });
  page.drawText(`Source SHA-256: ${envelope.sourceDocumentHash}`, { x: 48, y: 706, size: 7.5, font: regular });
  const signatureImages = new Map<string, Awaited<ReturnType<typeof pdf.embedPng>>>();
  for (const signer of envelope.signers) {
    if (signer.signatureAssetKey) signatureImages.set(signer.id, await pdf.embedPng(await assetBytes(signer.signatureAssetKey)));
  }
  let y = 650;
  for (const signer of envelope.signers) {
    page.drawText(`${signer.role} SIGNER`, { x: 48, y, size: 9, font: bold, color: rgb(.02,.45,.28) });
    page.drawText(signer.name, { x: 48, y: y - 24, size: 13, font: bold });
    page.drawText(`Electronic signature: ${signer.signatureText} (${signer.signatureMethod ?? "TYPED"})`, { x: 48, y: y - 47, size: 10, font: regular });
    page.drawText(`Signed: ${signer.signedAt?.toISOString()} | IP: ${signer.ipAddress ?? "unavailable"}`, { x: 48, y: y - 68, size: 8, font: regular });
    page.drawText(`Consent version: ${envelope.consentVersion}`, { x: 48, y: y - 86, size: 8, font: regular });
    const signatureImage = signatureImages.get(signer.id);
    if (signatureImage) page.drawImage(signatureImage, { x: 360, y: y - 82, width: 150, height: 58 });
    y -= 145;
  }
  page.drawText("This certificate records electronic consent and evidence captured by EstateDesk. Verify applicability and legal sufficiency for the governing jurisdiction.", { x: 48, y: 140, size: 8, font: regular, maxWidth: 490, lineHeight: 12 });
  const finalBytes = await pdf.save({ useObjectStreams: false });
  const finalDocumentHash = crypto.createHash("sha256").update(finalBytes).digest("hex");
  const key = `organizations/${envelope.orgId}/leases/${envelope.leaseId}/signed-${envelope.id}.pdf`;
  const claimed = await prisma.leaseSignatureEnvelope.updateMany({
    where: { id: envelopeId, status: "PARTIALLY_SIGNED" },
    data: { status: "FINALIZING" },
  });
  if (!claimed.count) return;
  try {
    await storage.uploadFile({ key, body: finalBytes, contentType: "application/pdf" });
    await prisma.$transaction(async (tx) => {
    const asset = await tx.asset.create({ data: {
      orgId: envelope.orgId, fileName: `signed-lease-${envelope.leaseId}.pdf`, fileType: "application/pdf",
      mimeType: "application/pdf", key, size: finalBytes.length, assetType: "CONTRACT", uploadedByUserId: envelope.createdByUserId,
      metadata: { envelopeId, sourceDocumentHash: envelope.sourceDocumentHash, finalDocumentHash },
    } });
    await tx.leaseSignatureEnvelope.update({ where: { id: envelopeId }, data: { status: "COMPLETED", completedAt: new Date(), finalAssetId: asset.id, finalDocumentHash } });
    await tx.lease.update({ where: { id: envelope.leaseId }, data: { contractDocumentId: asset.id } });
    await tx.leaseSignatureEvent.create({ data: { envelopeId, eventType: "COMPLETED", metadata: { finalDocumentHash, finalAssetId: asset.id } } });
    const signedUrl = storage.getPublicUrl(key);
    await notifyInAppAndPush({ db: tx, orgId: envelope.orgId, recipients: envelope.signers.filter((signer) => signer.userId).map((signer) => ({ userId: signer.userId!, tenantId: signer.role === "TENANT" ? envelope.lease.tenantId : null })), type: "GENERAL", title: "Signed lease completed", message: `All required parties signed the lease. Signed copy: ${signedUrl}` });
    });
  } catch (error) {
    await prisma.leaseSignatureEnvelope.updateMany({ where: { id: envelopeId, status: "FINALIZING" }, data: { status: "PARTIALLY_SIGNED" } });
    throwSafeActionFailure(
      "leaseSignatureFinalize",
      error,
      "Could not finalize the signed lease. Please try again.",
    );
  }
}

export async function signLease(input: { token: string; userId: string; signatureText: string; signatureMethod: LeaseSignatureMethod; signatureImage?: Uint8Array | null; consent: boolean; ipAddress?: string | null; userAgent?: string | null }) {
  if (!input.consent) throw new Error("Consent is required to sign electronically.");
  if (input.signatureText.trim().length < 2) throw new Error("Enter your full legal name as your signature.");
  const signer = await getLeaseSigningContext(input.token);
  if (!signer) throw new Error("This signing link is invalid.");
  if (!signer.userId || signer.userId !== input.userId) throw new Error("Sign in using the account assigned to this signature request.");
  if (signer.status !== "PENDING") return signer.envelope;
  if (!["PENDING", "PARTIALLY_SIGNED"].includes(signer.envelope.status)) throw new Error("This signing request is no longer active.");
  if (signer.envelope.expiresAt <= new Date()) {
    await prisma.leaseSignatureEnvelope.update({ where: { id: signer.envelopeId }, data: { status: "EXPIRED" } });
    throw new Error("This signing request has expired.");
  }
  if (signer.envelope.signingOrder === "SEQUENTIAL") {
    const priorPending = signer.envelope.signers.some((candidate) => candidate.signingOrder < signer.signingOrder && candidate.status !== "SIGNED");
    if (priorPending) throw new Error("An earlier signer must sign before you can continue.");
  }
  let signatureAssetKey: string | null = null;
  let signatureImageHash: string | null = null;
  if (input.signatureMethod !== "TYPED") {
    if (!input.signatureImage?.length || input.signatureImage.length > 2_000_000) throw new Error("Provide a signature image smaller than 2 MB.");
    signatureImageHash = crypto.createHash("sha256").update(input.signatureImage).digest("hex");
    signatureAssetKey = `organizations/${signer.envelope.orgId}/lease-signatures/${signer.envelopeId}/${signer.id}.png`;
    await storage.uploadFile({ key: signatureAssetKey, body: input.signatureImage, contentType: "image/png" });
  }
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.leaseSignatureSigner.update({ where: { id: signer.id }, data: { status: "SIGNED", signatureText: input.signatureText.trim(), signatureMethod: input.signatureMethod, signatureAssetKey, signatureImageHash, consentAcceptedAt: now, signedAt: now, ipAddress: input.ipAddress, userAgent: input.userAgent } });
    await tx.leaseSignatureEnvelope.update({ where: { id: signer.envelopeId }, data: { status: "PARTIALLY_SIGNED" } });
    await tx.leaseSignatureEvent.create({ data: { envelopeId: signer.envelopeId, signerId: signer.id, actorUserId: signer.userId, eventType: "SIGNED", ipAddress: input.ipAddress, userAgent: input.userAgent, metadata: { role: signer.role, consentVersion: signer.envelope.consentVersion, jurisdiction: signer.envelope.jurisdiction, signatureMethod: input.signatureMethod, signatureImageHash } } });
  });
  await finalizeEnvelope(signer.envelopeId);
  return prisma.leaseSignatureEnvelope.findUniqueOrThrow({ where: { id: signer.envelopeId } });
}

export async function declineLease(input: { token: string; reason: string; ipAddress?: string | null; userAgent?: string | null }) {
  const signer = await getLeaseSigningContext(input.token);
  if (!signer || signer.status !== "PENDING") throw new Error("This signing request is not active.");
  if (input.reason.trim().length < 5) throw new Error("Provide a reason for declining.");
  await prisma.$transaction([
    prisma.leaseSignatureSigner.update({ where: { id: signer.id }, data: { status: "DECLINED", declinedAt: new Date(), declineReason: input.reason.trim(), ipAddress: input.ipAddress, userAgent: input.userAgent } }),
    prisma.leaseSignatureEnvelope.update({ where: { id: signer.envelopeId }, data: { status: "DECLINED" } }),
    prisma.leaseSignatureEvent.create({ data: { envelopeId: signer.envelopeId, signerId: signer.id, actorUserId: signer.userId, eventType: "DECLINED", ipAddress: input.ipAddress, userAgent: input.userAgent, metadata: { reason: input.reason.trim() } } }),
  ]);
}

export async function remindLeaseSigner(envelopeId: string, signerId: string, orgId: string, actorUserId: string) {
  const signer = await prisma.leaseSignatureSigner.findFirst({ where: { id: signerId, envelopeId, envelope: { orgId, status: { in: ["PENDING", "PARTIALLY_SIGNED"] } }, status: "PENDING" }, include: { envelope: { include: { lease: true, org: true } } } });
  if (!signer) throw new Error("Pending signer not found.");
  const token = newToken();
  await prisma.$transaction(async (tx) => {
    await tx.leaseSignatureSigner.update({ where: { id: signer.id }, data: { tokenHash: tokenHash(token), lastReminderAt: new Date() } });
    await notifyInAppAndPush({ db: tx, orgId, recipients: [{ userId: signer.userId, tenantId: signer.role === "TENANT" ? signer.envelope.lease.tenantId : null }], type: "GENERAL", title: "Lease signature reminder", message: `Review and sign your lease: ${absoluteUrl(`/sign-lease/${token}`)}` });
    await tx.leaseSignatureEvent.create({ data: { envelopeId, signerId, actorUserId, eventType: "REMINDER_SENT" } });
  });
}

export async function cancelLeaseSignatureEnvelope(envelopeId: string, orgId: string, actorUserId: string, reason: string) {
  const result = await prisma.leaseSignatureEnvelope.updateMany({ where: { id: envelopeId, orgId, status: { in: ["PENDING", "PARTIALLY_SIGNED"] } }, data: { status: "CANCELLED", cancelledAt: new Date(), cancellationReason: reason || "Cancelled by organization." } });
  if (!result.count) throw new Error("Active signing request not found.");
  await prisma.leaseSignatureEvent.create({ data: { envelopeId, actorUserId, eventType: "CANCELLED", metadata: { reason } } });
}

export async function processLeaseSigningLifecycle() {
  const now = new Date();
  const expired = await prisma.leaseSignatureEnvelope.findMany({ where: { status: { in: ["PENDING", "PARTIALLY_SIGNED"] }, expiresAt: { lte: now } }, select: { id: true } });
  for (const envelope of expired) {
    await prisma.$transaction([
      prisma.leaseSignatureEnvelope.update({ where: { id: envelope.id }, data: { status: "EXPIRED" } }),
      prisma.leaseSignatureEvent.create({ data: { envelopeId: envelope.id, eventType: "EXPIRED" } }),
    ]);
  }
  const reminderBefore = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const dueSigners = await prisma.leaseSignatureSigner.findMany({
    where: { status: "PENDING", createdAt: { lte: reminderBefore }, OR: [{ lastReminderAt: null }, { lastReminderAt: { lte: reminderBefore } }], envelope: { status: { in: ["PENDING", "PARTIALLY_SIGNED"] }, expiresAt: { gt: now } } },
    include: { envelope: { select: { orgId: true, createdByUserId: true } } },
    take: 500,
  });
  for (const signer of dueSigners) await remindLeaseSigner(signer.envelopeId, signer.id, signer.envelope.orgId, signer.envelope.createdByUserId);
  return { expired: expired.length, remindersQueued: dueSigners.length };
}
