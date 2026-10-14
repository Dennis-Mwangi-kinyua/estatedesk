"use server";
import { hasActiveSecurityGate } from "./availability";
import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgRole, requireTenantAccess } from "@/lib/permissions/guards";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit/security";
import { getSiteUrl } from "@/lib/seo";
import { gateAccess } from "./access";
import { admitVisitor } from "./admission";
import { visitorSchema, visitorPassState } from "./policy";
export type VisitorState = { error?: string; message?: string; url?: string; qr?: string };
const hash = (token: string) => createHash("sha256").update(token).digest("hex");
export async function createVisitorPass(_state: VisitorState, form: FormData): Promise<VisitorState> {
  const session = await requireTenantAccess();
  const parsed = visitorSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check visitor details." };
  const data = parsed.data;
  if (Date.parse(data.validUntil) <= Date.now() || Date.parse(data.validFrom) > Date.now() + 30 * 86400000) return { error: "Choose a visit within the next 30 days." };
  const limit = await checkRateLimit({ key: `visitor-create:${session.activeOrgId}:${session.userId}`, limit: 20, windowMs: 3600000 });
  if (!limit.allowed) return { error: "You have created too many passes. Please try again later." };
  const lease = await prisma.lease.findFirst({ where: { orgId: session.activeOrgId!, tenant: { userId: session.userId, deletedAt: null }, status: "ACTIVE", deletedAt: null }, select: { id: true, unit: { select: { propertyId: true } } } });
  if (!lease) return { error: "An active tenancy is required to invite a visitor." };
  const gate = await hasActiveSecurityGate(session.activeOrgId!, lease.unit.propertyId);
  if (!gate) return { error: "Visitor invitations are available after your property manager sets up an active security account for this property." };
  const token = randomBytes(32).toString("base64url");
  const pass = await prisma.visitorPass.create({ data: { ...data, validFrom: new Date(data.validFrom), validUntil: new Date(data.validUntil), orgId: session.activeOrgId!, tenantUserId: session.userId, leaseId: lease.id, propertyId: lease.unit.propertyId, tokenHash: hash(token) } });
  // Fragment keeps the secret out of HTTP request URLs and referrer logs.
  const url = `${getSiteUrl()}/dashboard/gate#pass=${token}`;
  const QRCode = await import("qrcode");
  const qr = await QRCode.toDataURL(url, { width: 280, margin: 2, errorCorrectionLevel: "M" });
  await writeAuditLog({ orgId: session.activeOrgId!, actorUserId: session.userId, action: "VISITOR_PASS_CREATED", entityType: "VisitorPass", entityId: pass.id });
  revalidatePath("/dashboard/tenant/visitors");
  return { message: "Pass created. Share it with your visitor or gate staff. Keep this QR until the visit is complete.", url, qr };
}
export async function revokeVisitorPass(_state: VisitorState, form: FormData): Promise<VisitorState> {
  const session = await requireTenantAccess();
  await prisma.visitorPass.updateMany({ where: { id: String(form.get("id")), orgId: session.activeOrgId!, tenantUserId: session.userId, admittedAt: null, revokedAt: null }, data: { revokedAt: new Date() } });
  revalidatePath("/dashboard/tenant/visitors");
  return { message: "Pass revoked if it was still pending." };
}
export type GateState = VisitorState & { admittedId?: string; pass?: { id: string; visitorName: string; visitorPhone: string | null; vehiclePlate: string | null; tenant: string; unit: string; property: string; validFrom: string; validUntil: string; status: string } };
export async function verifyVisitorPass(_state: GateState, form: FormData): Promise<GateState> {
  const access = await gateAccess();
  const token = String(form.get("token") ?? "");
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return { error: "Scan a valid EstateDesk pass or paste its code." };
  const limit = await checkRateLimit({ key: `visitor-check:${access.orgId}:${access.session.userId}`, limit: 60, windowMs: 60000 });
  if (!limit.allowed) return { error: "Too many checks. Please wait a minute." };
  const pass = await prisma.visitorPass.findFirst({ where: { tokenHash: hash(token), orgId: access.orgId, ...(!access.manager ? { propertyId: { in: access.propertyIds } } : {}) } });
  if (!pass) return { error: "Pass not found or you are not assigned to this property's gate." };
  const lease = await prisma.lease.findFirst({ where: { id: pass.leaseId, orgId: access.orgId, tenant: { userId: pass.tenantUserId, deletedAt: null }, unit: { propertyId: pass.propertyId, property: { deletedAt: null } }, status: "ACTIVE", deletedAt: null }, select: { tenant: { select: { fullName: true } }, unit: { select: { houseNo: true, property: { select: { name: true } } } } } });
  if (!lease) return { error: "This tenancy is no longer active. Do not admit using this pass." };
  return { pass: { id: pass.id, visitorName: pass.visitorName, visitorPhone: pass.visitorPhone, vehiclePlate: pass.vehiclePlate, tenant: lease.tenant.fullName, unit: lease.unit.houseNo, property: lease.unit.property.name, validFrom: pass.validFrom.toISOString(), validUntil: pass.validUntil.toISOString(), status: visitorPassState(pass) } };
}
export async function admitVisitorPass(_state: GateState, form: FormData): Promise<GateState> {
  const access = await gateAccess();
  const id = String(form.get("id") ?? "");
  const admitted = await admitVisitor({ orgId: access.orgId, userId: access.session.userId, manager: access.manager, passId: id });
  if (!admitted) return { admittedId: id, error: "This pass is expired, revoked, already used, or outside your gate assignment. Verify it again." };
  await writeAuditLog({ orgId: access.orgId, actorUserId: access.session.userId, action: "VISITOR_ADMITTED", entityType: "VisitorPass", entityId: id });
  revalidatePath("/dashboard/gate");
  return { admittedId: id, message: "Admission recorded. The pass cannot be used again." };
}
export async function assignGateStaff(_state: VisitorState, form: FormData): Promise<VisitorState> {
  const session = await requireOrgRole(["ADMIN", "MANAGER"]);
  const orgId = session.activeOrgId!;
  const propertyId = String(form.get("propertyId"));
  const userId = String(form.get("userId"));
  const [property, member] = await Promise.all([prisma.property.findFirst({ where: { id: propertyId, orgId, deletedAt: null } }), prisma.membership.findFirst({ where: { orgId, userId, role: "SECURITY", deactivatedAt: null, employmentEndedAt: null, user: { deletedAt: null, status: "ACTIVE" } } })]);
  if (!property || !member) return { error: "Select a current staff member and property in your organization." };
  if (form.get("remove") === "1") await prisma.gateAssignment.deleteMany({ where: { orgId, userId, propertyId } });
  else await prisma.gateAssignment.upsert({ where: { orgId_userId_propertyId: { orgId, userId, propertyId } }, create: { orgId, userId, propertyId }, update: {} });
  await writeAuditLog({ orgId, actorUserId: session.userId, action: form.get("remove") === "1" ? "GATE_ACCESS_REMOVED" : "GATE_ACCESS_ASSIGNED", entityType: "Property", entityId: propertyId, metadata: { userId } });
  revalidatePath("/dashboard/gate");
  revalidatePath("/dashboard/tenant", "layout");
  return { message: "Gate access updated." };
}
