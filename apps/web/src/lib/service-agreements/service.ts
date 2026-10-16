import { canCancelAgreement } from "./listing";
import "server-only";
import crypto from "node:crypto";
import { readElectronicSignature } from "@/lib/uploads/electronic-signature";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuthenticated, requireOrgRole, requirePlatformRole } from "@/lib/permissions/guards";
import { getRequestAuditMetadata } from "@/lib/audit/security";
import { AGREEMENT_ENTITY, AGREEMENT_VERSION, agreementData, agreementTemplate, signatureName, type AgreementData } from "./contract";

const json = (value: AgreementData) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;
export const hashAgreement = (body: string) => crypto.createHash("sha256").update(body).digest("hex");
export async function accessibleAgreement(id: string) {
  const session = await requireAuthenticated();
  const platform = session.platformRole === "SUPER_ADMIN" || session.platformRole === "PLATFORM_ADMIN";
  if (!platform) await requireOrgRole(["ADMIN"]);
  const document = await prisma.documentRecord.findFirst({ where: {
    id, entityType: AGREEMENT_ENTITY,
    ...(!platform ? { orgId: session.activeOrgId!, status: { in: ["ISSUED", "COMPLETED"] } } : {}),
  }, include: { org: { select: { name: true, slug: true } }, events: { orderBy: { createdAt: "asc" } } } });
  if (!document) return null;
  return { session, platform, document, data: agreementData(document.metadata) };
}
export async function accessibleAgreementByVerificationCode(code: string) {
  await requireAuthenticated();
  if (!/^[a-f0-9]{48}$/.test(code)) return null;
  const document = await prisma.documentRecord.findFirst({ where: { verificationCode: code, entityType: AGREEMENT_ENTITY }, select: { id: true } });
  return document ? accessibleAgreement(document.id) : null;
}
export async function createAgreement(form: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]);
  const field = (key: string, min = 2, max = 8000) => {
    const value = String(form.get(key) ?? "").trim();
    if (value.length < min || value.length > max) throw Error(`Please provide a valid ${key}.`);
    return value;
  };
  const orgId = field("orgId", 1, 100);
  const org = await prisma.organization.findFirst({ where: { id: orgId, deletedAt: null } });
  if (!org) throw Error("Organization not found.");
  const provider = field("provider", 2, 240), contact = field("contact", 5, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) throw Error("Provide a valid privacy contact email.");
  const representative = field("representative", 2, 160);
  const body = agreementTemplate({ organization: field("customer", 2, 240), provider, contact, representative,
    services: field("services", 20), infrastructure: field("infrastructure", 20), retention: field("retention", 20) });
  const id = crypto.randomUUID();
  return prisma.documentRecord.create({ data: {
    orgId, entityType: AGREEMENT_ENTITY, entityId: id, documentType: "OTHER", status: "DRAFT",
    title: `Service Agreement and Data Processing Addendum — ${org.name}`,
    serialNumber: `ED-SA-${id}`, verificationCode: crypto.randomBytes(24).toString("hex"),
    contentHash: hashAgreement(body), issuedByUserId: session.userId,
    metadata: json({ templateVersion: AGREEMENT_VERSION, representative, body }),
    events: { create: { orgId, actorUserId: session.userId, eventType: "CREATED", metadata: { representative, templateVersion: AGREEMENT_VERSION } } },
  } });
}
export async function changeAgreement(id: string, form: FormData) {
  const access = await accessibleAgreement(id);
  if (!access) throw Error("Agreement not found.");
  const { session, platform, document, data } = access;
  const command = String(form.get("command"));
  const hash = String(form.get("contentHash") ?? "");
  if (!document.contentHash || hash !== document.contentHash || hashAgreement(data.body) !== hash) throw Error("The agreement changed. Reload and review it before continuing.");
  const request = await getRequestAuditMetadata();
  if (command === "cancel") {
    if (!canCancelAgreement(platform, document.status)) throw Error("Only drafts and pending agreements can be cancelled by platform administrators.");
    const reason = String(form.get("reason") ?? "").trim();
    if (form.get("confirmCancellation") !== "on" || reason.length < 5 || reason.length > 1000) throw Error("Provide a cancellation reason and confirm cancellation.");
    await prisma.$transaction(async tx => {
      const result = await tx.documentRecord.updateMany({where:{id,orgId:document.orgId,status:document.status,contentHash:hash,metadata:{equals:json(data)}},data:{status:"REVOKED",revokedAt:new Date(),revocationReason:reason}});
      if (result.count !== 1) throw Error("The agreement changed. Reload before cancelling.");
      await tx.documentEvent.create({data:{documentId:id,orgId:document.orgId,actorUserId:session.userId,eventType:"REVOKED",ip:request.ip,userAgent:request.userAgent,metadata:{action:"AGREEMENT_CANCELLED",reason,previousStatus:document.status,contentHash:hash}}});
      if (document.status === "ISSUED") {
        const admins = await tx.membership.findMany({where:{orgId:document.orgId,role:"ADMIN",deactivatedAt:null,employmentEndedAt:null,user:{deletedAt:null,status:"ACTIVE"}},select:{userId:true},distinct:["userId"]});
        await tx.notification.createMany({data:admins.map(admin=>({orgId:document.orgId,userId:admin.userId,channel:"IN_APP" as const,type:"GENERAL" as const,status:"SENT" as const,sentAt:new Date(),title:"Service agreement signing request cancelled",message:`EstateDesk cancelled ${document.serialNumber}. Reason: ${reason}`,providerResponse:{actionUrl:"/dashboard/org/agreements",agreementId:id}}))});
      }
    });
    return;
  }
  if (command === "edit") {
    if (!platform || document.status !== "DRAFT") throw Error("Only an unsigned draft can be edited.");
    const body = String(form.get("body") ?? "").trim();
    if (body.length < 500 || body.length > 60000) throw Error("Agreement text must contain 500–60,000 characters.");
    await prisma.$transaction(async tx => {
      const result = await tx.documentRecord.updateMany({ where: { id, orgId: document.orgId, status: "DRAFT", contentHash: hash }, data: { metadata: json({ ...data, body }), contentHash: hashAgreement(body) } });
      if (result.count !== 1) throw Error("The agreement changed. Reload to continue.");
      await tx.documentEvent.create({ data: { documentId: id, orgId: document.orgId, actorUserId: session.userId, eventType: "CREATED", ip: request.ip, userAgent: request.userAgent, metadata: { action: "DRAFT_REVISED", previousHash: hash, contentHash: hashAgreement(body) } } });
    });
    return;
  }
  if (command === "send") {
    if (!platform || document.status !== "DRAFT") throw Error("Only a draft can be sent.");
    await prisma.$transaction(async tx => {
      const admins = await tx.membership.findMany({ where: { orgId: document.orgId, role: "ADMIN", deactivatedAt: null, employmentEndedAt: null, user: { deletedAt: null, status: "ACTIVE" } }, select: { userId: true }, distinct: ["userId"] });
      if (!admins.length) throw Error("The organization needs an active administrator.");
      const result = await tx.documentRecord.updateMany({ where: { id, status: "DRAFT", contentHash: hash }, data: { status: "ISSUED", issuedAt: new Date() } });
      if (result.count !== 1) throw Error("The agreement changed. Reload to continue.");
      await tx.documentEvent.create({ data: { documentId: id, orgId: document.orgId, actorUserId: session.userId, eventType: "SIGNING_REQUESTED", ip: request.ip, userAgent: request.userAgent, metadata: { contentHash: hash } } });
      await tx.notification.createMany({ data: admins.map(admin => ({ orgId: document.orgId, userId: admin.userId, channel: "IN_APP" as const, type: "GENERAL" as const, status: "SENT" as const, sentAt: new Date(), title: "Service agreement ready for your signature", message: "Review and sign your service agreement first. EstateDesk will then countersign and release the completed PDF.", providerResponse: { actionUrl: `/dashboard/org/agreements/${id}`, agreementId: id } })) });
    });
    return;
  }
  if (!["platform-sign", "org-sign"].includes(command)) throw Error("Unknown agreement action.");
  const platformSigning = command === "platform-sign";
  if (document.status !== "ISSUED" || (platformSigning ? !platform || !data.organizationSignature || !!data.platformSignature : platform || !!data.organizationSignature)) throw Error("You cannot sign this agreement in its current state.");
  const name = String(form.get("name") ?? "").trim();
  if (form.get("consent") !== "on" || !signatureName(name, session.fullName)) throw Error("Enter your account's full name and confirm your authority and agreement to the displayed terms.");
  const captured = await readElectronicSignature(form);
  const signature = { method: captured.method, ...(captured.imageData ? { imageData: captured.imageData, imageHash: captured.imageHash } : {}), name, userId: session.userId, signedAt: new Date().toISOString(), contentHash: hash };
  const next = platformSigning ? { ...data, platformSignature: signature } : { ...data, organizationSignature: signature };
  await prisma.$transaction(async tx => {
    const completed = !!next.platformSignature && !!next.organizationSignature;
    const result = await tx.documentRecord.updateMany({ where: { id, orgId: document.orgId, status: "ISSUED", contentHash: hash, metadata: { equals: json(data) } }, data: { status: completed ? "COMPLETED" : "ISSUED", metadata: json(next) } });
    if (result.count !== 1) throw Error("This agreement has already changed or been signed. Reload to continue.");
    const evidence = { documentId: id, orgId: document.orgId, actorUserId: session.userId, ip: request.ip, userAgent: request.userAgent, metadata: { party: platformSigning ? "ESTATEDESK" : "ORGANIZATION", name, contentHash: hash, signedAt: signature.signedAt, signatureMethod: captured.method, signatureImageHash: captured.imageHash ?? null, consent: true } };
    await tx.documentEvent.createMany({ data: [
      { ...evidence, eventType: "SIGNED" },
      { ...evidence, eventType: completed ? "COMPLETED" : "SIGNING_REQUESTED" },
    ] });
    const recipients = await tx.membership.findMany({ where: { orgId: document.orgId, role: "ADMIN", deactivatedAt: null, employmentEndedAt: null, user: { deletedAt: null, status: "ACTIVE" } }, select: { userId: true }, distinct: ["userId"] });
    if (completed) await tx.notification.createMany({ data: recipients.map(admin => ({ orgId: document.orgId, userId: admin.userId, channel: "IN_APP" as const, type: "GENERAL" as const, status: "SENT" as const, sentAt: new Date(), title: "Service agreement completed", message: "Both parties have signed. Download the completed agreement from your organization profile or Service Agreements.", providerResponse: { actionUrl: `/dashboard/org/agreements/${id}`, agreementId: id } })) });
    if (document.issuedByUserId) await tx.notification.create({ data: { orgId: document.orgId, userId: document.issuedByUserId, channel: "IN_APP", type: "GENERAL", status: "SENT", sentAt: new Date(), title: completed ? "Service agreement completed" : "Service agreement awaiting platform signature", message: completed ? `${document.org.name}'s completed agreement is available for download.` : `${document.org.name} has signed and submitted its agreement. Review and countersign for EstateDesk.`, providerResponse: { actionUrl: `/platform/agreements/${id}`, agreementId: id } } });
  });
}
