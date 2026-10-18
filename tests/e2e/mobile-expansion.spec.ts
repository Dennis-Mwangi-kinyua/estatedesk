import { PDFDocument } from "pdf-lib";
import { randomUUID } from "node:crypto";
import { readFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { test, expect, type APIRequestContext } from "playwright/test";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { configureTestDatabase } from "../integration/database-safety";
import { mobileInspectionFields } from "../../packages/contracts/src/mobile";

test.beforeEach(({}, info) => test.skip(!process.env.ROLE_WORKSPACE_FIXTURE || info.project.name !== "chromium", "Requires fictional local accounts"));
const native = { "X-EstateDesk-Client": "native", "X-EstateDesk-Capabilities": "2026-10-18" };
async function setup(request: APIRequestContext) {
  const f = JSON.parse(await readFile(process.env.ROLE_WORKSPACE_FIXTURE!, "utf8"));
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: configureTestDatabase()! }) });
  const login = async (role: string) => {
    const response = await request.post("/api/mobile/login", { headers: native, data: { email: f.accounts[role].email, password: f.accounts[role].password } });
    expect(response.status(), await response.text()).toBe(200);
    return { ...native, Cookie: (await response.json()).sessionCookie as string };
  };
  const lease = await db.lease.findFirstOrThrow({ where: { orgId: f.orgId, tenant: { userId: f.accounts.TENANT.id } }, include: { unit: true } });
  return { f, db, login, lease };
}

test("native payment review issues an owned PDF receipt and enforces scope, permission and final status", async ({ request }) => {
  test.setTimeout(180000);
  const { f, db, login, lease } = await setup(request);
  const tag = randomUUID();
  const charge = await db.rentCharge.create({ data: { orgId: f.orgId, leaseId: lease.id, period: `test-${tag}`, dueDate: new Date(), amountDue: 500, balance: 500 } });
  const payment = await db.payment.create({ data: { orgId: f.orgId, payerTenantId: lease.tenantId, payerUserId: f.accounts.TENANT.id, method: "MPESA_MANUAL", amount: 300, targetType: "RENT", rentChargeId: charge.id, externalReference: `review-${tag}`, callbackRaw: { transactionMessage: "Fictional bank confirmation" } } });
  const rejected = await db.payment.create({ data: { orgId: f.orgId, payerTenantId: lease.tenantId, method: "BANK", amount: 50, targetType: "RENT", rentChargeId: charge.id } });
  const otherPayment = await db.payment.create({ data: { orgId: f.orgId, payerUserId: f.accounts.MANAGER.id, method: "CASH", amount: 10, targetType: "OTHER", verificationStatus: "VERIFIED" } });
  const otherReceipt = await db.receipt.create({ data: { paymentId: otherPayment.id, receiptNo: `other-${tag}` } });
  const pdfSource = await PDFDocument.create(); pdfSource.addPage(); const pdfBytes = await pdfSource.save();
  const leaseAsset = await db.asset.create({ data: { orgId: f.orgId, uploadedByUserId: f.accounts.MANAGER.id, fileName: "fictional-signed-lease.pdf", fileType: "application/pdf", mimeType: "application/pdf", key: "temporary", size: pdfBytes.length, assetType: "CONTRACT", metadata: { pdfBase64: Buffer.from(pdfBytes).toString("base64") } } });
  await db.asset.update({ where: { id: leaseAsset.id }, data: { key: `database:${leaseAsset.id}` } });
  await db.lease.update({ where: { id: lease.id }, data: { contractDocumentId: leaseAsset.id } });
  const member = await db.membership.findFirstOrThrow({ where: { orgId: f.orgId, userId: f.accounts.ACCOUNTANT.id } });
  const originalSettings = await db.organizationSettings.findUnique({ where: { orgId: f.orgId } });
  try {
    const tenant = await login("TENANT"); const office = await login("OFFICE"); const staff = await login("ACCOUNTANT");
    expect((await request.get("/api/mobile/org/payments", { headers: tenant })).status()).toBe(403);
    expect((await request.get("/api/mobile/org/payments", { headers: office })).status()).toBe(403);
    const summary = await (await request.get("/api/mobile/session", { headers: tenant })).json(); expect(summary.features).toContain("documents");
    const legacy = await (await request.get("/api/mobile/session", { headers: { "X-EstateDesk-Client": "native", Cookie: tenant.Cookie } })).json(); expect(legacy.features).not.toContain("documents");
    const queue = await request.get("/api/mobile/org/payments", { headers: staff }); expect(queue.status(), await queue.text()).toBe(200);
    expect((await queue.json()).payments.find((p: { id: string }) => p.id === payment.id)?.proof).toBe("Fictional bank confirmation");
    await db.membership.update({ where: { id: member.id }, data: { scopeType: "UNIT", scopeId: "unassigned-unit" } });
    expect((await (await request.get("/api/mobile/org/payments", { headers: staff })).json()).payments).toEqual([]);
    expect((await request.post("/api/mobile/org/payments", { headers: staff, data: { id: payment.id, action: "verify", note: "Confirmed against fictional bank records." } })).status()).toBe(409);
    await db.membership.update({ where: { id: member.id }, data: { scopeType: member.scopeType, scopeId: member.scopeId } });
    const verified = await request.post("/api/mobile/org/payments", { headers: staff, data: { id: payment.id, action: "verify", note: "Confirmed against fictional bank records." } }); expect(verified.status(), await verified.text()).toBe(200);
    expect(Number((await db.rentCharge.findUniqueOrThrow({ where: { id: charge.id } })).balance)).toBe(200);
    expect((await request.post("/api/mobile/org/payments", { headers: staff, data: { id: payment.id, action: "reject", note: "Must never reject verified money." } })).status()).toBe(409);
    const receipt = await db.receipt.findUniqueOrThrow({ where: { paymentId: payment.id } });
    const documents = await request.get("/api/mobile/tenant/documents", { headers: tenant }); expect(documents.status(), await documents.text()).toBe(200);
    const listedDocuments = await documents.json();
    expect(listedDocuments.some((doc: { id: string }) => doc.id === receipt.id)).toBe(true);
    expect(listedDocuments.some((doc: { id: string }) => doc.id === otherReceipt.id)).toBe(false);
    expect((await request.get(`/api/mobile/tenant/documents/receipt/${otherReceipt.id}`, { headers: tenant })).status()).toBe(404);
    expect(listedDocuments.some((doc: { id: string; kind: string }) => doc.id === lease.id && doc.kind === "lease")).toBe(true);
    const leasePdf = await request.get(`/api/mobile/tenant/documents/lease/${lease.id}`, { headers: tenant }); expect(leasePdf.status(), await leasePdf.text()).toBe(200); expect(leasePdf.headers()["content-type"]).toContain("application/pdf");
    const pdf = await request.get(`/api/mobile/tenant/documents/receipt/${receipt.id}`, { headers: tenant }); expect(pdf.status(), await pdf.text()).toBe(200); expect(pdf.headers()["content-type"]).toContain("application/pdf"); expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
    expect((await request.get("/api/mobile/tenant/documents/receipt/foreign-receipt", { headers: tenant })).status()).toBe(404);
    const rejectedResult = await request.post("/api/mobile/org/payments", { headers: staff, data: { id: rejected.id, action: "reject", note: "Reference does not appear in bank records." } }); expect(rejectedResult.status(), await rejectedResult.text()).toBe(200);
    expect((await db.payment.findUniqueOrThrow({ where: { id: rejected.id } })).verificationStatus).toBe("REJECTED");
    expect(await db.receipt.count({ where: { paymentId: rejected.id } })).toBe(0);
    await db.organizationSettings.upsert({ where: { orgId: f.orgId }, create: { orgId: f.orgId, roleAccess: { TENANT: { permissions: {}, blockedViews: ["payments"] } } }, update: { roleAccess: { TENANT: { permissions: {}, blockedViews: ["payments"] } } } });
    expect([401, 403]).toContain((await request.get(`/api/mobile/tenant/documents/receipt/${receipt.id}`, { headers: tenant })).status());
  } finally {
    await db.organizationSettings.update({ where: { orgId: f.orgId }, data: { roleAccess: originalSettings?.roleAccess ?? Prisma.DbNull } });
    await db.membership.update({ where: { id: member.id }, data: { scopeType: member.scopeType, scopeId: member.scopeId } });
    await db.lease.update({ where: { id: lease.id }, data: { contractDocumentId: lease.contractDocumentId } });
    await db.asset.delete({ where: { id: leaseAsset.id } });
    await db.receipt.delete({ where: { id: otherReceipt.id } }); await db.payment.delete({ where: { id: otherPayment.id } });
    await db.paymentAllocation.deleteMany({ where: { paymentId: { in: [payment.id, rejected.id] } } });
    await db.receipt.deleteMany({ where: { paymentId: { in: [payment.id, rejected.id] } } });
    await db.payment.deleteMany({ where: { id: { in: [payment.id, rejected.id] } } });
    await db.rentCharge.delete({ where: { id: charge.id } }); await db.$disconnect();
  }
});

test("native field evidence and offline acknowledgements survive retries without duplicate work", async ({ request }) => {
  test.setTimeout(180000);
  const { f, db, login, lease } = await setup(request);
  const tag = randomUUID(); const period = "2097-03";
  const assignment = await db.caretakerAssignment.create({ data: { orgId: f.orgId, caretakerUserId: f.accounts.CARETAKER.id, unitId: lease.unitId } });
  const notice = await db.moveOutNotice.create({ data: { referenceCode: tag, tenantId: lease.tenantId, leaseId: lease.id, moveOutDate: new Date(), status: "INSPECTION_SCHEDULED" } });
  const inspection = await db.inspection.create({ data: { referenceCode: tag, noticeId: notice.id, inspectorUserId: f.accounts.CARETAKER.id, scheduledAt: new Date() } });
  const assetIds: string[] = [];
  try {
    const headers = await login("CARETAKER"); const tenant = await login("TENANT");
    expect((await request.get("/api/mobile/caretaker/inspections", { headers: tenant })).status()).toBe(403);
    expect((await (await request.get("/api/mobile/caretaker/inspections", { headers })).json()).some((i: { id: string }) => i.id === inspection.id)).toBe(true);
    const png = { name: "evidence.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=", "base64") };
    const meterId = randomUUID();
    const reading = { unitId: lease.unitId, period, currentReading: "987654", notes: "Fictional offline reading", clientId: meterId, photo: png };
    const first = await request.post("/api/mobile/caretaker/meters", { headers, multipart: reading }); expect(first.status(), await first.text()).toBe(200);
    expect((await request.post("/api/mobile/caretaker/meters", { headers, multipart: reading })).status()).toBe(200);
    expect(await db.meterReading.count({ where: { unitId: lease.unitId, period } })).toBe(1);
    const meter = await db.meterReading.findUniqueOrThrow({ where: { unitId_period: { unitId: lease.unitId, period } } }); expect(meter.photoAssetId).toBeTruthy(); assetIds.push(meter.photoAssetId!);
    expect((await request.post("/api/mobile/caretaker/meters", { headers, multipart: { ...reading, currentReading: "987655" } })).status()).toBe(400);
    await db.caretakerAssignment.update({ where: { id: assignment.id }, data: { active: false } });
    // Fixture assignments may also cover this unit; foreign units must still fail authorization.
    expect((await request.post("/api/mobile/caretaker/meters", { headers, multipart: { ...reading, unitId: "foreign-unit", clientId: randomUUID() } })).status()).toBe(400);
    await db.caretakerAssignment.update({ where: { id: assignment.id }, data: { active: true } });
    const report = { inspectionId: inspection.id, ...Object.fromEntries(mobileInspectionFields.map(field => [field.name, field.name === "damageObserved" ? "no" : "yes"])), summary: "Fictional handover checked in full.", recommendations: "No repairs needed.", clientId: randomUUID(), photo_damageObserved: png };
    const completed = await request.post("/api/mobile/caretaker/inspections", { headers, multipart: report }); expect(completed.status(), await completed.text()).toBe(200);
    const saved = await db.inspection.findUniqueOrThrow({ where: { id: inspection.id } }); expect(saved.status).toBe("COMPLETED"); expect((await db.moveOutNotice.findUniqueOrThrow({ where: { id: notice.id } })).status).toBe("INSPECTION_COMPLETED");
    const checklist = saved.checklist as { roomPhotos: Record<string, string> }; assetIds.push(...Object.values(checklist.roomPhotos));
    expect((await request.post("/api/mobile/caretaker/inspections", { headers, multipart: report })).status()).toBe(200);
    expect(await db.auditLog.count({ where: { entityId: inspection.id, action: "INSPECTION_COMPLETED" } })).toBe(1);
    expect((await request.post("/api/mobile/caretaker/inspections", { headers, multipart: { ...report, summary: "Changed payload using the same draft ID" } })).status()).toBe(400);
    expect((await request.post("/api/mobile/caretaker/inspections", { headers, multipart: { ...report, inspectionId: "foreign-inspection", clientId: randomUUID() } })).status()).not.toBe(200);
    expect((await request.post("/api/mobile/caretaker/meters", { headers, multipart: { ...reading, clientId: randomUUID(), photo: { ...png, buffer: Buffer.alloc(2 * 1024 * 1024 + 1) } } })).status()).toBe(400);
  } finally {
    await db.meterReading.deleteMany({ where: { unitId: lease.unitId, period } }); await db.waterBill.deleteMany({ where: { unitId: lease.unitId, period } });
    await db.moveOutNotice.delete({ where: { id: notice.id } }); await db.caretakerAssignment.delete({ where: { id: assignment.id } });
    await db.offlineSubmission.deleteMany({ where: { orgId: f.orgId, userId: f.accounts.CARETAKER.id, kind: { startsWith: "native-" } } });
    const assets = await db.asset.findMany({ where: { id: { in: assetIds } } });
    for (const asset of assets) if (asset.key.startsWith("/uploads/")) await unlink(resolve("apps/web/public", asset.key.slice(1))).catch(() => {});
    await db.asset.deleteMany({ where: { id: { in: assetIds } } }); await db.$disconnect();
  }
});

test("native visitor passes require an assigned gate and admit once, with revocation enforced", async ({ request }) => {
  test.setTimeout(120000);
  const { f, db, login, lease } = await setup(request);
  const assignment = await db.gateAssignment.upsert({ where: { orgId_userId_propertyId: { orgId: f.orgId, userId: f.accounts.SECURITY.id, propertyId: lease.unit.propertyId } }, create: { orgId: f.orgId, userId: f.accounts.SECURITY.id, propertyId: lease.unit.propertyId }, update: {} });
  const name = `Native visitor ${randomUUID()}`;
  try {
    const tenant = await login("TENANT"); const gate = await login("SECURITY"); const caretaker = await login("CARETAKER");
    const input = { action: "create", visitorName: name, visitorPhone: "", vehiclePlate: "TEST", validFrom: new Date(Date.now() - 1000).toISOString(), validUntil: new Date(Date.now() + 3600000).toISOString() };
    const created = await request.post("/api/mobile/tenant/visitors", { headers: tenant, data: input }); expect(created.status(), await created.text()).toBe(200);
    const result = await created.json(); expect(result.qr).toMatch(/^data:image\/png;base64,/);
    const token = new URLSearchParams(new URL(result.url).hash.slice(1)).get("pass");
    const own = await (await request.get("/api/mobile/tenant/visitors", { headers: tenant })).json(); const pass = own.find((p: { visitorName: string }) => p.visitorName === name); expect(pass.status).toBe("READY"); expect(JSON.stringify(own)).not.toContain(token);
    expect((await request.post("/api/mobile/gate/visitors", { headers: tenant, data: { action: "verify", token } })).status()).toBe(403);
    expect((await request.post("/api/mobile/gate/visitors", { headers: caretaker, data: { action: "verify", token } })).status()).toBe(400);
    const checked = await request.post("/api/mobile/gate/visitors", { headers: gate, data: { action: "verify", token } }); expect(checked.status(), await checked.text()).toBe(200); expect((await checked.json()).pass.id).toBe(pass.id);
    expect((await request.post("/api/mobile/gate/visitors", { headers: gate, data: { action: "admit", id: pass.id } })).status()).toBe(200);
    expect((await request.post("/api/mobile/gate/visitors", { headers: gate, data: { action: "admit", id: pass.id } })).status()).toBe(400);
    const second = await request.post("/api/mobile/tenant/visitors", { headers: tenant, data: input }); expect(second.status()).toBe(200);
    const pending = await db.visitorPass.findFirstOrThrow({ where: { orgId: f.orgId, visitorName: name, admittedAt: null } });
    expect((await request.post("/api/mobile/tenant/visitors", { headers: tenant, data: { action: "revoke", id: pending.id } })).status()).toBe(200);
    expect((await request.post("/api/mobile/gate/visitors", { headers: gate, data: { action: "admit", id: pending.id } })).status()).toBe(400);
  } finally {
    await db.visitorPass.deleteMany({ where: { orgId: f.orgId, visitorName: name } }); await db.gateAssignment.delete({ where: { id: assignment.id } }); await db.$disconnect();
  }
});
