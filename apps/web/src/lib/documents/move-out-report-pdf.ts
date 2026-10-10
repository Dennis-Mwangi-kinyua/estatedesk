import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createDocumentVerificationQrDataUrl } from "./verification-qr";

/** Paginated statement layout. The QR destination retains the report's access checks. */
export async function createMoveOutReportPdf(input: {
  title: string; organisation: string; reference: string; lines: string[];
  reportUrl: string; closed: boolean;
}) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.06, 0.12, 0.22);
  const muted = rgb(0.35, 0.40, 0.47);
  const accent = rgb(0.08, 0.40, 0.46);
  const clean = (value: string) => Array.from(value).map(char => {
    try { regular.encodeText(char); return char; } catch { return "-"; }
  }).join("");
  const wrap = (value: string, width: number, size = 10) => {
    const result: string[] = []; let line = "";
    for (const char of clean(value)) {
      if (char === "\n" || regular.widthOfTextAtSize(line + char, size) > width) {
        result.push(line.trimEnd()); line = char === "\n" ? "" : char;
      } else line += char;
    }
    result.push(line.trimEnd()); return result;
  };
  let page = pdf.addPage([595.28, 841.89]); let y = 0;
  const header = () => {
    page.drawRectangle({ x: 0, y: 827, width: 595.28, height: 15, color: accent });
    page.drawText("EstateDesk", { x: 42, y: 786, size: 25, font: bold, color: ink });
    y = 762;
    for (const line of wrap(input.organisation, 510, 12)) {
      page.drawText(line, { x: 42, y, size: 12, font: regular, color: muted }); y -= 17;
    }
    y -= 10;
    page.drawText(input.title, { x: 42, y, size: 13, font: bold, color: accent }); y -= 21;
    for (const line of wrap(`Report reference: ${input.reference}`, 510, 9)) {
      page.drawText(line, { x: 42, y, size: 9, font: regular, color: muted }); y -= 13;
    }
    y -= 12;
  };
  header();
  const ensure = (height: number) => {
    if (y - height < 65) { page = pdf.addPage([595.28, 841.89]); header(); }
  };
  const section = (title: string) => {
    ensure(55); y -= 8;
    page.drawRectangle({ x: 42, y: y - 7, width: 511, height: 25, color: rgb(0.93, 0.96, 0.97) });
    page.drawText(title, { x: 51, y, size: 11, font: bold, color: ink }); y -= 29;
  };
  section("Tenant and handover details");
  for (const raw of input.lines) {
    if (!raw) { y -= 8; continue; }
    if (["Current outstanding bills", "Settlement recorded at handover", "Deposit and readiness", "Agreed costs breakdown", "Proposed costs breakdown"].includes(raw)) {
      section(raw); continue;
    }
    const amount = raw.match(/^(.*): (-?\d+\.\d{2})$/);
    if (amount) {
      const rows = wrap(amount[1], 385);
      ensure(rows.length * 15 + 9);
      for (const row of rows) { page.drawText(row, { x: 48, y, size: 10, font: regular, color: ink }); y -= 15; }
      const formattedAmount = Number(amount[2]).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      page.drawText(formattedAmount, { x: 545 - bold.widthOfTextAtSize(formattedAmount, 10), y: y + 15, size: 10, font: bold, color: ink });
      y -= 5;
    } else {
      for (const row of wrap(raw, 499)) {
        ensure(16); page.drawText(row, { x: 48, y, size: 10, font: regular, color: ink }); y -= 15;
      }
      y -= 4;
    }
  }
  ensure(230);
  section("Final note");
  const note = input.closed
    ? "This statement records the handover settlement. Current balances may change when subsequent payments are posted. A refund is complete only when its payment has been recorded. Retain this report with your receipts and handover records."
    : "This is a preliminary report. Review final rent, utilities, inspection findings and agreed costs before handover. Proposed refunds and amounts owed remain subject to the final settlement.";
  for (const row of wrap(note, 499)) {
    ensure(16); page.drawText(row, { x: 48, y, size: 10, font: regular, color: muted }); y -= 15;
  }
  ensure(120); y -= 12;
  const qr = await pdf.embedPng(await createDocumentVerificationQrDataUrl(input.reportUrl));
  page.drawImage(qr, { x: 44, y: y - 90, width: 90, height: 90 });
  page.drawText("View the latest report", { x: 149, y: y - 23, size: 11, font: bold, color: ink });
  for (const [index, row] of wrap("Scan to open this report in EstateDesk. Sign in with an authorised tenant or management account.", 385, 9).entries()) {
    page.drawText(row, { x: 149, y: y - 42 - index * 14, size: 9, font: regular, color: muted });
  }
  const pages = pdf.getPages();
  pages.forEach((sheet, index) => {
    sheet.drawLine({ start: { x: 42, y: 48 }, end: { x: 553, y: 48 }, thickness: 0.5, color: muted });
    sheet.drawText("EstateDesk | Move-out statement", { x: 42, y: 32, size: 8, font: regular, color: muted });
    sheet.drawText(`Page ${index + 1} of ${pages.length}`, { x: 485, y: 32, size: 8, font: regular, color: muted });
  });
  return pdf.save();
}
