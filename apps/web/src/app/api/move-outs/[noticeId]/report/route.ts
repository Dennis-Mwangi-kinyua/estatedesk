import { calculateSettlement, parseCostItems } from "@/lib/move-outs/settlement";
import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { loadMoveOutBalances } from "@/lib/move-outs/balances";
import { depositHeldCents, finalBillingIssues } from "@/lib/move-outs/readiness";
import { financialStatus } from "@/lib/move-outs/financial-status";
import { nairobiDate } from "@/lib/move-outs/validation";
import { decodePublicId } from "@/lib/public-id";

export async function GET(_request: Request, { params }: { params: Promise<{ noticeId: string }> }) {
  const session = await requireUserSession();
  const { noticeId: publicNoticeId } = await params;
  const noticeId = decodePublicId(publicNoticeId, "move-out-notice");
  const notice = await prisma.moveOutNotice.findUnique({ where: { id: noticeId }, include: { tenant: true, inspection: true, lease: { include: { org: true, unit: { include: { property: true } } } } } });
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
  const text = [closed ? "FINAL MOVE-OUT STATEMENT" : "PRE-HANDOVER MOVE-OUT REPORT", notice.lease.org.name, `Generated: ${nairobiDate()} | Currency: ${notice.lease.org.currencyCode}`, `Tenant: ${notice.tenant.fullName}`, `Property: ${notice.lease.unit.property.name} | Unit: ${notice.lease.unit.houseNo}`, `Notice: ${notice.id}`, `Planned handover: ${nairobiDate(notice.moveOutDate)}`, `Actual handover: ${notice.actualMoveOutDate ? nairobiDate(notice.actualMoveOutDate) : "Pending"}`, `Occupancy: ${notice.status} | Unit: ${notice.lease.unit.status}`, `Inspection: ${notice.inspection?.status ?? "Not scheduled"}`, `Final meter reading: ${reading ? `${reading.prevReading} to ${reading.currentReading}; usage ${reading.unitsUsed}; ${reading.status}` : "Not recorded"}`, `Inspection notes: ${notice.inspection?.notes ?? "None"}`, `Inspection findings: ${JSON.stringify(notice.inspection?.checklist ?? {})}`, "", "Current outstanding bills", ...balances.charges.map(c => `${c.period} ${c.description ?? c.chargeType}: ${Number(c.balance).toFixed(2)}`), ...balances.water.map(b => `${b.period} water: ${(b.remainingCents / 100).toFixed(2)}`), `Current amount owed: ${(balances.totalCents / 100).toFixed(2)}`, `Financial status: ${closed ? financialStatus(balances.totalCents, settlement.refundStatus === "PENDING") : "PRELIMINARY"}`, "", closed ? "Settlement recorded at handover" : "Deposit and readiness", `Deposit: ${closed ? Number(settlement.depositHeld ?? 0).toFixed(2) : ((await depositHeldCents(prisma, notice.lease)) / 100).toFixed(2)}`, ...["outstandingBills", "additionalCosts", "deductions", "refundDue", "amountOwed"].filter(key => settlement[key] !== undefined).map(key => `${key}: ${Number(settlement[key]).toFixed(2)}`), ...(Array.isArray(settlement.itemisedCosts) ? settlement.itemisedCosts.map(item => item && typeof item === "object" && !Array.isArray(item) ? `${item.description}: ${Number(item.amount).toFixed(2)}` : "") : []), `Refund status: ${settlement.refundStatus ?? "Not finalised"}`, `Refund reference: ${settlement.refundReference ?? "None"}`, `Refund proof asset: ${settlement.refundProofAssetId ?? "None"}`, `Notes: ${settlement.notes ?? notice.notes ?? "None"}`, ...issues.map(issue => `REQUIRED: ${issue}`), ...(!closed ? [...preview.itemisedCosts.map(item => `${item.description}: ${item.amount.toFixed(2)}`), `Proposed total costs: ${preview.totalCosts.toFixed(2)}`, `Proposed deposit deduction: ${preview.deductions.toFixed(2)}`, `Proposed refund: ${preview.refundDue.toFixed(2)}`, `Proposed amount owed: ${preview.amountOwed.toFixed(2)}`, "Preliminary: final costs and bills must be reviewed before closure."] : [])];
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  let page = pdf.addPage(); let y = page.getHeight() - 45;
  for (const line of text) {
    const safe = String(line).replace(/[^\x20-\x7E]/g, "?");
    const chunks = safe.match(/.{1,90}(?:\s|$)|.{1,90}/g) ?? [""];
    for (const chunk of chunks) { if (y < 45) { page = pdf.addPage(); y = page.getHeight() - 45; } page.drawText(chunk.trim(), { x: 40, y, size: 10, font }); y -= 15; }
  }
  if (!closed && notice.tenant.userId !== session.userId) await prisma.auditLog.create({ data: { orgId: notice.lease.orgId, actorUserId: session.userId, action: "MOVE_OUT_REPORT_GENERATED", entityType: "MoveOutNotice", entityId: notice.id, metadata: { outstandingBills: balances.totalCents / 100, itemisedCosts: preview.itemisedCosts, depositHeld: held / 100, issues } } });
  return new NextResponse(Buffer.from(await pdf.save()), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="move-out-${notice.referenceCode}.pdf"`, "Cache-Control": "private, no-store" } });
}
