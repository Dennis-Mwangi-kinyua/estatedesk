import { calculateSettlement, parseCostItems } from "@/lib/move-outs/settlement";
import { NextResponse } from "next/server";
import { createMoveOutReportPdf } from "@/lib/documents/move-out-report-pdf";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { loadMoveOutBalances } from "@/lib/move-outs/balances";
import { depositHeldCents, finalBillingIssues } from "@/lib/move-outs/readiness";
import { financialStatus } from "@/lib/move-outs/financial-status";
import { nairobiDate } from "@/lib/move-outs/validation";
import { decodePublicId } from "@/lib/public-id";
import { reportChecklistItems } from "@/app/(app)/dashboard/caretaker/inspections/[inspectionId]/_lib/constants";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { MoveOutReportPhoto } from "@/lib/documents/move-out-report-pdf";

async function readInspectionImage(key: string): Promise<Uint8Array> {
  if (key.startsWith("https://imagedelivery.net/")) {
    const url = new URL(key);
    if (url.hostname !== "imagedelivery.net" || url.username || url.password) throw new Error("Unsupported image URL");
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10_000), redirect: "error" });
    if (!response.ok) throw new Error("Image unavailable");
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > 5 * 1024 * 1024) throw new Error("Image too large");
    return bytes;
  }
  if (!key.startsWith("/uploads/inspections/")) throw new Error("Unsupported image location");
  const fileName = path.basename(key);
  if (!fileName || fileName !== key.slice("/uploads/inspections/".length)) throw new Error("Invalid image location");
  const bytes = new Uint8Array(await readFile(path.join(process.cwd(), "public", "uploads", "inspections", fileName)));
  if (bytes.byteLength > 5 * 1024 * 1024) throw new Error("Image too large");
  return bytes;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function reportDateTime(value: unknown) {
  if (typeof value !== "string" && !(value instanceof Date)) return "Not recorded";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Nairobi",
  }).format(date);
}

function checklistResult(key: string, value: boolean) {
  if (key === "damageObserved") return value ? "Damage observed" : "No damage reported";
  if (key === "keysReturned") return value ? "Returned" : "Not returned";
  if (key === "meterReadingsTaken") return value ? "Captured" : "Not captured";
  if (key === "cleanlinessOk") return value ? "Acceptable" : "Needs attention";
  return value ? "Good" : "Needs attention";
}

export async function GET(_request: Request, { params }: { params: Promise<{ noticeId: string }> }) {
  const session = await requireUserSession();
  const { noticeId: publicNoticeId } = await params;
  const noticeId = decodePublicId(publicNoticeId, "move-out-notice");
  const notice = await prisma.moveOutNotice.findUnique({
    where: { id: noticeId },
    include: {
      tenant: true,
      inspection: { include: { inspector: { select: { fullName: true } } } },
      lease: { include: { org: true, unit: { include: { property: true } } } },
    },
  });
  if (!notice) return new NextResponse("Not found", { status: 404 });
  if (notice.tenant.userId !== session.userId) {
    const manager = await requireManagementAccess();
    if (manager.activeOrgId !== notice.lease.orgId) return new NextResponse("Not found", { status: 404 });
  }
  const balances = await loadMoveOutBalances(prisma, notice.lease);
  const closed = notice.status === "CLOSED";
  const settlement = notice.closeout && typeof notice.closeout === "object" && !Array.isArray(notice.closeout) ? notice.closeout : {};
  const issues = closed ? [] : await finalBillingIssues(prisma, notice.lease, notice.moveOutDate);
  const reading = await prisma.meterReading.findUnique({ where: { unitId_period: { unitId: notice.lease.unitId, period: nairobiDate(notice.actualMoveOutDate ?? notice.moveOutDate).slice(0, 7) } } });
  const held = await depositHeldCents(prisma, notice.lease);
  let preview;
  try { preview = calculateSettlement(held, balances.totalCents, parseCostItems(new URL(_request.url).searchParams.get("costItems") ?? "[]")); } catch { return new NextResponse("Invalid itemised costs", { status: 400 }); }
  const checklist = isRecord(notice.inspection?.checklist) ? notice.inspection.checklist : {};
  const roomPhotos = isRecord(checklist.roomPhotos) ? checklist.roomPhotos : {};
  const checkIn = isRecord(checklist.checkIn) ? checklist.checkIn : null;
  const inspectionSummary = typeof checklist.summary === "string" && checklist.summary.trim()
    ? checklist.summary.trim()
    : notice.inspection?.notes?.trim();
  const recommendations = typeof checklist.recommendations === "string" ? checklist.recommendations.trim() : "";
  const photoEntries = [
    ...reportChecklistItems.flatMap(item => typeof roomPhotos[item.key] === "string" ? [{ key: roomPhotos[item.key] as string, label: item.label }] : []),
    ...(typeof checkIn?.photoAssetId === "string" ? [{ key: checkIn.photoAssetId, label: "Site check-in" }] : []),
  ];
  const attachedPhotoLabels = photoEntries.map(photo => photo.label);
  const photoAssets = photoEntries.length ? await prisma.asset.findMany({
    where: {
      id: { in: photoEntries.map(photo => photo.key) }, orgId: notice.lease.orgId,
      unitId: notice.lease.unitId, deletedAt: null,
      metadata: { path: ["inspectionId"], equals: notice.inspection?.id ?? "" },
    },
    select: { id: true, fileName: true, key: true, mimeType: true },
  }) : [];
  const photos: MoveOutReportPhoto[] = [];
  for (const entry of photoEntries) {
    const asset = photoAssets.find(item => item.id === entry.key);
    if (!asset || (asset.mimeType !== "image/jpeg" && asset.mimeType !== "image/png")) continue;
    try {
      const bytes = await readInspectionImage(asset.key);
      photos.push({ label: entry.label, fileName: asset.fileName, mimeType: asset.mimeType, bytes });
    } catch {
      // The report remains available when an old or unavailable photo cannot be embedded.
    }
  }
  const inspectionLines = notice.inspection ? [
    "Inspection findings",
    `Assigned inspector: ${notice.inspection.inspector.fullName}`,
    `Inspection scheduled: ${reportDateTime(notice.inspection.scheduledAt)}`,
    `Inspection summary: ${inspectionSummary || "Not recorded"}`,
    ...(recommendations ? [`Recommended follow-up: ${recommendations}`] : []),
    "Inspection checklist",
    ...reportChecklistItems.flatMap(item => typeof checklist[item.key] === "boolean"
      ? [[item.label, checklistResult(item.key, checklist[item.key] as boolean)].join(": ")]
      : []),
    `Supporting photos: ${attachedPhotoLabels.length} attached${photos.length < photoEntries.length ? `; ${photoEntries.length - photos.length} could not be embedded` : "; see photo appendix"}${attachedPhotoLabels.length ? ` (${attachedPhotoLabels.join(", ")})` : ""}`,
    `On-site check-in: ${checkIn ? `Recorded${typeof checkIn.capturedAt === "string" ? ` at ${reportDateTime(checkIn.capturedAt)}` : ""}` : "Not recorded"}`,
    `Inspection submitted: ${reportDateTime(checklist.submittedAt ?? notice.inspection.completedAt)}`,
  ] : ["Inspection findings", "Inspection report: Not submitted"];
  const text = [
    closed ? "FINAL MOVE-OUT STATEMENT" : "PRE-HANDOVER MOVE-OUT REPORT",
    notice.lease.org.name,
    `Generated: ${nairobiDate()} | Currency: ${notice.lease.org.currencyCode}`,
    `Tenant: ${notice.tenant.fullName}`,
    `Property: ${notice.lease.unit.property.name}`,
    `Unit: ${notice.lease.unit.houseNo}`,
    `Planned handover: ${nairobiDate(notice.moveOutDate)}`,
    `Actual handover: ${notice.actualMoveOutDate ? nairobiDate(notice.actualMoveOutDate) : "Pending"}`,
    `Notice status: ${notice.status.replaceAll("_", " ")}`,
    `Unit status: ${notice.lease.unit.status.replaceAll("_", " ")}`,
    `Inspection status: ${notice.inspection?.status.replaceAll("_", " ") ?? "Not scheduled"}`,
    "Meter readings",
    ...(reading ? [
      `Previous reading: ${reading.prevReading}`,
      `Final reading: ${reading.currentReading}`,
      `Usage: ${reading.unitsUsed}`,
      `Reading status: ${reading.status.replaceAll("_", " ")}`,
    ] : ["Final meter reading: Not recorded"]),
    ...inspectionLines,
    "Current outstanding bills",
    ...balances.charges.map(c => `${c.period} ${c.description ?? c.chargeType}: ${Number(c.balance).toFixed(2)}`),
    ...balances.water.map(b => `${b.period} water: ${(b.remainingCents / 100).toFixed(2)}`),
    `Current amount owed: ${(balances.totalCents / 100).toFixed(2)}`,
    `Financial status: ${closed ? financialStatus(balances.totalCents, settlement.refundStatus === "PENDING") : "Preliminary"}`,
    closed ? "Settlement recorded at handover" : "Deposit and readiness",
    `Deposit: ${closed ? Number(settlement.depositHeld ?? 0).toFixed(2) : ((await depositHeldCents(prisma, notice.lease)) / 100).toFixed(2)}`,
    ...["outstandingBills", "additionalCosts", "deductions", "refundDue", "amountOwed"].filter(key => settlement[key] !== undefined).map(key => `${({ outstandingBills: "Outstanding bills at handover", additionalCosts: "Additional costs", deductions: "Deposit applied", refundDue: "Refund due", amountOwed: "Amount owed at handover" } as Record<string, string>)[key]}: ${Number(settlement[key]).toFixed(2)}`),
    "Agreed costs breakdown",
    ...(Array.isArray(settlement.itemisedCosts) ? settlement.itemisedCosts.map(item => item && typeof item === "object" && !Array.isArray(item) ? `${item.description}: ${Number(item.amount).toFixed(2)}` : "") : []),
    `Refund status: ${settlement.refundStatus ?? "Not finalised"}`,
    `Refund reference: ${settlement.refundReference ?? "None"}`,
    `Notes: ${settlement.notes ?? notice.notes ?? "None"}`,
    ...issues.map(issue => `REQUIRED: ${issue}`),
    ...(!closed ? ["Proposed costs breakdown", ...preview.itemisedCosts.map(item => `${item.description}: ${item.amount.toFixed(2)}`), `Proposed total costs: ${preview.totalCosts.toFixed(2)}`, `Proposed deposit deduction: ${preview.deductions.toFixed(2)}`, `Proposed refund: ${preview.refundDue.toFixed(2)}`, `Proposed amount owed: ${preview.amountOwed.toFixed(2)}`, "Preliminary: final costs and bills must be reviewed before closure."] : []),
  ];
  const reportUrl = new URL(_request.url);
  reportUrl.search = "";
  const bytes = await createMoveOutReportPdf({
    title: text[0], organisation: notice.lease.org.name, reference: notice.referenceCode,
    currencyCode: notice.lease.org.currencyCode,
    photos,
    lines: text.slice(2).filter(line => !line.startsWith("Notice:") && !line.startsWith("Refund proof asset:")),
    reportUrl: reportUrl.toString(), closed,
  });
  if (!closed && notice.tenant.userId !== session.userId) await prisma.auditLog.create({ data: { orgId: notice.lease.orgId, actorUserId: session.userId, action: "MOVE_OUT_REPORT_GENERATED", entityType: "MoveOutNotice", entityId: notice.id, metadata: { outstandingBills: balances.totalCents / 100, itemisedCosts: preview.itemisedCosts, depositHeld: held / 100, issues } } });
  return new NextResponse(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="move-out-${notice.referenceCode}.pdf"`, "Cache-Control": "private, no-store" } });
}
