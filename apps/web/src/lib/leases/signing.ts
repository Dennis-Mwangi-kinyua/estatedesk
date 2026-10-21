import "server-only";

import { ClientSafeError } from "@/lib/errors/client-safe-error";
import { requireOrgPermission } from "@/lib/permissions/guards";
import { scopedUnitWhere } from "@/lib/permissions/record-scope";
import { leaseTenantReadiness, leaseSigningSteps, signerCanSign } from "./signing-workflow";
import crypto from "node:crypto";
import { appendLeaseSigningCertificate } from "@/lib/documents/signed-lease-pdf";
import { throwSafeActionFailure } from "@/lib/errors/server-error-log";
import { prisma } from "@/lib/prisma";
import { notifyInAppAndPush } from "@/lib/notifications/notify";
import { absoluteUrl } from "@/lib/seo";
import { readAssetBytes } from "@/lib/storage/read-asset-bytes";
import { storage } from "@/lib/storage";
import type { LeaseSignerRole, LeaseSigningJurisdiction, LeaseSigningOrder, LeaseSignatureMethod } from "@prisma/client";

export const LEASE_CONSENT_VERSION = "2026-07-02";
export const LEASE_CONSENT: Record<LeaseSigningJurisdiction, string> = {
  KENYA: "I have reviewed this lease and intend to sign it electronically. I consent to EstateDesk linking my authenticated account, signature representation, timestamp, IP address, device information and the document SHA-256 hash as evidence of my approval. I understand this native EstateDesk signature is not represented as a certified advanced electronic signature.",
  UAE: "I have reviewed this lease and intend to sign it electronically. I consent to EstateDesk linking my authenticated account, signature representation, timestamp, IP address, device information and the document SHA-256 hash as evidence of my approval. I understand this native EstateDesk signature is not a Qualified Electronic Signature issued by a UAE Qualified Trust Service Provider.",
};
const tokenHash = (token: string) => crypto.createHash("sha256").update(token).digest("hex");
const newToken = () => crypto.randomBytes(32).toString("base64url");

const assetBytes = readAssetBytes;

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
  const session = await requireOrgPermission("leases.manage");
  if (session.activeOrgId !== input.orgId || session.userId !== input.createdByUserId) throw new ClientSafeError("Lease access is unavailable.");
  const lease = await prisma.lease.findFirst({
    where: { id: input.leaseId, orgId: input.orgId, deletedAt: null, tenant: { deletedAt: null }, unit: scopedUnitWhere(input.orgId, session.membershipScope) },
    include: { org: true, tenant: { include: { user: true } }, contractDocument: true },
  });
  if (!lease?.contractDocument) throw new ClientSafeError("Generate or upload a PDF tenancy agreement before requesting signatures.");
  if (!Number.isFinite(input.expiresInDays) || !["KENYA", "UAE"].includes(input.jurisdiction ?? "KENYA") || !["SEQUENTIAL", "PARALLEL"].includes(input.signingOrder ?? "SEQUENTIAL")) throw new ClientSafeError("Choose a valid signing order, jurisdiction, and expiry.");
  if (lease.contractDocument.mimeType !== "application/pdf") throw new ClientSafeError("Online signing currently requires a PDF lease contract.");
  const readiness = leaseTenantReadiness(lease.tenant.user);
  if (readiness) throw new ClientSafeError(readiness);
  if (!lease.tenant.userId) throw new ClientSafeError("The tenant needs a linked EstateDesk user account before online signing.");
  if (input.signingOrder && input.signingOrder !== "SEQUENTIAL") throw new ClientSafeError("Tenancy agreements must be signed by the tenant before the organization countersigns.");
  if (await prisma.leaseSignatureEnvelope.count({ where: { leaseId: lease.id, status: "FINALIZING" } })) throw new ClientSafeError("The signed agreement is being finalized. Please wait before starting another request.");
  const actor = await prisma.user.findUniqueOrThrow({ where: { id: input.createdByUserId } });
  const sourceAsset = lease.contractDocument;
  const bytes = await assetBytes(sourceAsset.key);
  const sourceDocumentHash = crypto.createHash("sha256").update(bytes).digest("hex");
  const organizationToken = newToken();
  const tenantToken = newToken();
  const jurisdiction = input.jurisdiction ?? "KENYA";
  const signingOrder = "SEQUENTIAL" as const;
  const requestedAdditional = input.additionalSigners ?? [];
  if (new Set([actor.id, lease.tenant.userId, ...requestedAdditional.map(item => item.userId)]).size !== requestedAdditional.length + 2) throw new ClientSafeError("Each signing party must use a different account.");
  const steps = leaseSigningSteps(requestedAdditional.map(item => item.role));
  const additionalUsers = await prisma.user.findMany({ where: { id: { in: requestedAdditional.map((item) => item.userId) }, status: "ACTIVE", OR: [{ memberships: { some: { orgId: lease.orgId, employmentEndedAt: null } } }, { tenant: { some: { orgId: lease.orgId, deletedAt: null } } }, { landlordProfiles: { some: { orgId: lease.orgId, isActive: true, deletedAt: null } } }] }, select: { id: true, fullName: true, email: true, phone: true, status: true, lastLoginAt: true } });
  for (const item of requestedAdditional.filter(item => item.role === "TENANT")) {
    const user = additionalUsers.find(user => user.id === item.userId);
    const readiness = leaseTenantReadiness(user ?? null);
    if (readiness) throw new ClientSafeError("Every additional tenant must have an active account and complete their first login before sending the agreement.");
  }
  if (additionalUsers.length !== new Set(requestedAdditional.map((item) => item.userId)).size) throw new ClientSafeError("Every additional signer must have an active EstateDesk login.");
  const userMap = new Map(additionalUsers.map((user) => [user.id, user]));
  const extraTokens = requestedAdditional.map((item) => ({ item, user: userMap.get(item.userId)!, token: newToken() }));
  const latestCompleted = await prisma.leaseSignatureEnvelope.findFirst({ where: { leaseId: lease.id, status: "COMPLETED" }, orderBy: { version: "desc" } });
  if (latestCompleted?.finalAssetId === sourceAsset.id) throw new ClientSafeError("Upload a new or amended lease PDF before starting another signing round.");
  const expiresAt = new Date(Date.now() + Math.min(Math.max(input.expiresInDays, 1), 60) * 86_400_000);
  const envelope = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Lease" WHERE "id" = ${lease.id} AND "orgId" = ${lease.orgId} FOR UPDATE`;
    const currentLease = await tx.lease.findUniqueOrThrow({ where: { id: lease.id }, select: { contractDocumentId: true } });
    if (currentLease.contractDocumentId !== sourceAsset.id) throw new ClientSafeError("The agreement changed. Reload the lease before sending.");
    const active = await tx.leaseSignatureEnvelope.count({ where: { leaseId: lease.id, status: { in: ["PENDING", "PARTIALLY_SIGNED", "FINALIZING"] } } });
    if (active) throw new ClientSafeError("An agreement is already awaiting signatures. Cancel that request before sending a replacement.");
    const latestVersion = await tx.leaseSignatureEnvelope.aggregate({ where: { leaseId: lease.id }, _max: { version: true } });
    const created = await tx.leaseSignatureEnvelope.create({
      data: {
        orgId: lease.orgId, leaseId: lease.id, sourceAssetId: sourceAsset.id,
        sourceDocumentHash, expiresAt, message: input.message, consentVersion: LEASE_CONSENT_VERSION,
        jurisdiction, consentText: LEASE_CONSENT[jurisdiction], signingOrder,
        version: (latestVersion._max.version ?? 0) + 1, amendmentOfId: input.amendment ? latestCompleted?.id : null,
        createdByUserId: input.createdByUserId,
        signers: { create: [
          { role: "ORGANIZATION", signingOrder: steps.organization, userId: actor.id, name: actor.fullName, email: actor.email, phone: actor.phone, tokenHash: tokenHash(organizationToken) },
          { role: "TENANT", signingOrder: steps.tenant, userId: lease.tenant.userId, name: lease.tenant.fullName, email: lease.tenant.email, phone: lease.tenant.phone, tokenHash: tokenHash(tenantToken) },
          ...extraTokens.map(({ item, user, token }, index) => ({ role: item.role, signingOrder: steps.additional[index], label: item.label, userId: user.id, name: user.fullName, email: user.email, phone: user.phone, tokenHash: tokenHash(token) })),
        ] },
        events: { create: { eventType: "CREATED", actorUserId: input.createdByUserId, metadata: { sourceDocumentHash, expiresAt: expiresAt.toISOString() } } },
      },
    });
    await notifyInAppAndPush({
      db: tx, orgId: lease.orgId,
      recipients: [{ tenantId: lease.tenant.id, userId: lease.tenant.userId }],
      type: "GENERAL", title: "Lease signature requested",
      message: `${lease.org.name} sent your tenancy agreement. Review and sign first; the organization will then countersign. Review and sign: ${absoluteUrl(`/sign-lease/${tenantToken}`)}`,
    });
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
  if (envelope.status !== "PARTIALLY_SIGNED" || !envelope.signers.every((signer) => signer.status === "SIGNED")) return;
  const sourceAsset = await prisma.asset.findUniqueOrThrow({ where: { id: envelope.sourceAssetId } });
  const source = await assetBytes(sourceAsset.key);
  const actualHash = crypto.createHash("sha256").update(source).digest("hex");
  if (actualHash !== envelope.sourceDocumentHash) throw new Error("The lease document changed after the signing request was created.");
  const verificationUrl = absoluteUrl(`/verify-lease/envelope/${envelope.id}`);
  const finalBytes = await appendLeaseSigningCertificate(source, {
    envelopeId: envelope.id, leaseId: envelope.leaseId, organizationName: envelope.org.name,
    premises: `${envelope.lease.unit.property.name} / Unit ${envelope.lease.unit.houseNo}`,
    version: envelope.version, sourceDocumentHash: envelope.sourceDocumentHash, consentVersion: envelope.consentVersion, verificationUrl,
    signers: await Promise.all(envelope.signers.sort((a, b) => a.signingOrder - b.signingOrder).map(async signer => ({
      ...signer, image: signer.signatureAssetKey ? await assetBytes(signer.signatureAssetKey) : undefined,
    }))),
  });
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
      metadata: { envelopeId, sourceDocumentHash: envelope.sourceDocumentHash, finalDocumentHash, certificatePrivacyVersion: 2 },
    } });
    await tx.leaseSignatureEnvelope.update({ where: { id: envelopeId }, data: { status: "COMPLETED", completedAt: new Date(), finalAssetId: asset.id, finalDocumentHash } });
    await tx.lease.update({ where: { id: envelope.leaseId }, data: { contractDocumentId: asset.id } });
    await tx.leaseSignatureEvent.create({ data: { envelopeId, eventType: "COMPLETED", metadata: { finalDocumentHash, finalAssetId: asset.id } } });
    await notifyInAppAndPush({ db: tx, orgId: envelope.orgId, recipients: envelope.signers.filter((signer) => signer.userId).map((signer) => ({ userId: signer.userId!, tenantId: signer.role === "TENANT" ? envelope.lease.tenantId : null })), type: "GENERAL", title: "Signed lease completed", message: "All required parties signed the lease. The completed PDF with signatures and QR verification is available in your lease workspace." });
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
  if (signer.status === "SIGNED") {
    await finalizeEnvelope(signer.envelopeId);
    return prisma.leaseSignatureEnvelope.findUniqueOrThrow({ where: { id: signer.envelopeId } });
  }
  if (signer.status !== "PENDING") throw new Error("This signature request is no longer pending.");
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
    await tx.$queryRaw`SELECT "id" FROM "LeaseSignatureEnvelope" WHERE "id" = ${signer.envelopeId} FOR UPDATE`;
    const current = await tx.leaseSignatureEnvelope.findUniqueOrThrow({ where: { id: signer.envelopeId }, include: { signers: true } });
    if (!["PENDING", "PARTIALLY_SIGNED"].includes(current.status) || current.expiresAt <= now) throw new Error("This signing request is no longer active.");
    if (current.signers.find(party => party.id === signer.id)?.status !== "PENDING") throw new Error("Your signature has already been recorded.");
    if (current.signingOrder === "SEQUENTIAL" && current.signers.some(party => party.signingOrder < signer.signingOrder && party.status !== "SIGNED")) throw new Error("An earlier signer must sign before you can continue.");
    await tx.leaseSignatureSigner.update({ where: { id: signer.id }, data: { status: "SIGNED", signatureText: input.signatureText.trim(), signatureMethod: input.signatureMethod, signatureAssetKey, signatureImageHash, consentAcceptedAt: now, signedAt: now, ipAddress: input.ipAddress, userAgent: input.userAgent } });
    await tx.leaseSignatureEnvelope.update({ where: { id: signer.envelopeId }, data: { status: "PARTIALLY_SIGNED" } });
    await tx.leaseSignatureEvent.create({ data: { envelopeId: signer.envelopeId, signerId: signer.id, actorUserId: signer.userId, eventType: "SIGNED", ipAddress: input.ipAddress, userAgent: input.userAgent, metadata: { role: signer.role, consentVersion: signer.envelope.consentVersion, jurisdiction: signer.envelope.jurisdiction, signatureMethod: input.signatureMethod, signatureImageHash } } });
    const updatedSigners = current.signers.map(party => party.id === signer.id ? { ...party, status: "SIGNED" } : party);
    for (const next of updatedSigners.filter(party => signerCanSign(party, updatedSigners))) {
      const token = newToken();
      await tx.leaseSignatureSigner.update({ where: { id: next.id }, data: { tokenHash: tokenHash(token) } });
      await notifyInAppAndPush({ db: tx, orgId: current.orgId, recipients: [{ userId: next.userId, tenantId: next.role === "TENANT" && next.userId === signer.envelope.lease.tenant.userId ? signer.envelope.lease.tenantId : null }],
        type: "GENERAL", title: next.role === "ORGANIZATION" ? "Tenant signed — countersign the agreement" : "Your turn to sign the tenancy agreement",
        message: `${next.role === "ORGANIZATION" ? "The tenant has signed. Review and countersign" : "The previous party has signed. Review and sign"}: ${absoluteUrl(`/sign-lease/${token}`)}` });
    }

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
  const signer = await prisma.leaseSignatureSigner.findFirst({ where: { id: signerId, envelopeId, envelope: { orgId, status: { in: ["PENDING", "PARTIALLY_SIGNED"] } }, status: "PENDING" }, include: { envelope: { include: { lease: true, org: true, signers: true } } } });
  if (!signer) throw new Error("Pending signer not found.");
  if (signer.envelope.signingOrder === "SEQUENTIAL" && !signerCanSign(signer, signer.envelope.signers)) return;
  const token = newToken();
  await prisma.$transaction(async (tx) => {
    await tx.leaseSignatureSigner.update({ where: { id: signer.id }, data: { tokenHash: tokenHash(token), lastReminderAt: new Date() } });
    await notifyInAppAndPush({ actorUserId: actorUserId, db: tx, orgId, recipients: [{ userId: signer.userId, tenantId: signer.role === "TENANT" ? signer.envelope.lease.tenantId : null }], type: "GENERAL", title: "Lease signature reminder", message: `Review and sign your lease: ${absoluteUrl(`/sign-lease/${token}`)}` });
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
