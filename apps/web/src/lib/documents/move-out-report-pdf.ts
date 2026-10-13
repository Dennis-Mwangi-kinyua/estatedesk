import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { createDocumentVerificationQrDataUrl } from "./verification-qr";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const LEFT = 42;
const RIGHT = 553;
const CONTENT_WIDTH = RIGHT - LEFT;
const BOTTOM_LIMIT = 72;

type ReportRow = { label: string; value: string; amount?: number };

/** Paginated handover report with grouped details, readable tables, and a verified live link. */
export async function createMoveOutReportPdf(input: {
  title: string;
  organisation: string;
  reference: string;
  lines: string[];
  reportUrl: string;
  closed: boolean;
}) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.07, 0.13, 0.22);
  const muted = rgb(0.36, 0.42, 0.49);
  const accent = rgb(0.05, 0.35, 0.42);
  const accentWash = rgb(0.91, 0.95, 0.96);
  const border = rgb(0.84, 0.88, 0.91);
  const white = rgb(1, 1, 1);
  const amber = rgb(0.57, 0.31, 0.03);
  const amberWash = rgb(1, 0.96, 0.87);
  let page!: PDFPage;
  let y = 0;
  let pageNumber = 0;

  const clean = (value: string) => Array.from(value).map(char => {
    try { regular.encodeText(char); return char; } catch { return "-"; }
  }).join("");

  const wrap = (value: string, width: number, size: number, font: PDFFont = regular) => {
    const lines: string[] = [];
    for (const paragraph of clean(value).split("\n")) {
      let line = "";
      for (const char of paragraph) {
        if (line && font.widthOfTextAtSize(line + char, size) > width) {
          lines.push(line.trimEnd());
          line = char.trim() ? char : "";
        } else line += char;
      }
      lines.push(line.trimEnd());
    }
    return lines.length ? lines : [""];
  };

  const drawWrapped = (target: PDFPage, value: string, x: number, top: number, width: number, size: number, font: PDFFont, color: ReturnType<typeof rgb>, lineHeight = size + 4) => {
    const lines = wrap(value, width, size, font);
    lines.forEach((line, index) => target.drawText(line, { x, y: top - size - index * lineHeight, size, font, color }));
    return lines.length * lineHeight;
  };

  const startPage = () => {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pageNumber += 1;
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 14, width: PAGE_WIDTH, height: 14, color: accent });
    page.drawText("EstateDesk", { x: LEFT, y: 786, size: 23, font: bold, color: ink });
    drawWrapped(page, input.organisation, LEFT, 777, 320, 10, regular, muted, 13);
    const status = input.closed ? "FINAL STATEMENT" : "PRELIMINARY REPORT";
    const statusWidth = bold.widthOfTextAtSize(status, 8) + 20;
    page.drawRectangle({ x: RIGHT - statusWidth, y: 786, width: statusWidth, height: 20, color: input.closed ? accentWash : amberWash, borderColor: input.closed ? accent : amber, borderWidth: 0.6 });
    page.drawText(status, { x: RIGHT - statusWidth + 10, y: 792, size: 8, font: bold, color: input.closed ? accent : amber });
    y = 735;
    page.drawText(input.title, { x: LEFT, y, size: 18, font: bold, color: ink });
    y -= 25;
    page.drawText(`Report reference  ${clean(input.reference)}`, { x: LEFT, y, size: 9, font: bold, color: accent });
    page.drawLine({ start: { x: LEFT, y: y - 12 }, end: { x: RIGHT, y: y - 12 }, thickness: 0.8, color: border });
    y -= 30;
  };

  const ensure = (height: number) => {
    if (y - height < BOTTOM_LIMIT) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      pageNumber += 1;
      page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 8, width: PAGE_WIDTH, height: 8, color: accent });
      page.drawText("EstateDesk | Move-out report", { x: LEFT, y: 805, size: 9, font: bold, color: ink });
      page.drawText(clean(input.reference), { x: RIGHT - regular.widthOfTextAtSize(clean(input.reference), 8), y: 805, size: 8, font: regular, color: muted });
      y = 780;
    }
  };

  const drawSection = (title: string) => {
    ensure(37);
    y -= 1;
    page.drawRectangle({ x: LEFT, y: y - 4, width: CONTENT_WIDTH, height: 24, color: accentWash });
    page.drawText(clean(title), { x: LEFT + 9, y: y + 3, size: 10, font: bold, color: accent });
    y -= 20;
  };

  const splitRow = (raw: string): ReportRow => {
    const separator = raw.indexOf(":");
    if (separator < 0) return { label: "Details", value: raw };
    const label = raw.slice(0, separator).trim();
    const value = raw.slice(separator + 1).trim();
    const amountMatch = value.match(/^(-?\d[\d,]*(?:\.\d{1,2})?)$/);
    return {
      label: label || "Details",
      value,
      amount: amountMatch ? Number(amountMatch[1].replaceAll(",", "")) : undefined,
    };
  };

  const drawTableHeader = (firstColumn: string, secondColumn: string, amountColumn = false) => {
    ensure(26);
    page.drawRectangle({ x: LEFT, y: y - 3, width: CONTENT_WIDTH, height: 21, color: rgb(0.96, 0.97, 0.98) });
    page.drawText(clean(firstColumn), { x: LEFT + 8, y: y + 3, size: 8, font: bold, color: muted });
    const secondWidth = bold.widthOfTextAtSize(clean(secondColumn), 8);
    page.drawText(clean(secondColumn), { x: RIGHT - secondWidth - 8, y: y + 3, size: 8, font: bold, color: muted });
    y -= 21;
    if (amountColumn) page.drawLine({ start: { x: RIGHT - 126, y: y + 2 }, end: { x: RIGHT - 126, y: y + 21 }, thickness: 0.5, color: border });
  };

  const drawRow = (raw: string, index: number, financialTable: boolean) => {
    const row = splitRow(raw);
    const hasAmount = financialTable && row.amount !== undefined;
    const valueWidth = hasAmount ? 365 : financialTable ? CONTENT_WIDTH - 16 : RIGHT - (LEFT + 151) - 8;
    const labelWidth = hasAmount ? 365 : 138;
    const labelLines = wrap(row.label, labelWidth, 9, regular);
    const valueLines = wrap(row.value, valueWidth, 9, regular);
    const lineCount = financialTable && hasAmount ? Math.max(labelLines.length, 1) : Math.max(labelLines.length, valueLines.length, 1);
    const rowHeight = Math.max(25, lineCount * 12 + 12);
    if (y - rowHeight < BOTTOM_LIMIT) {
      ensure(rowHeight + 25);
      drawTableHeader(financialTable ? "Item / status" : "Information", financialTable ? "Amount / value" : "Record");
    }
    if (index % 2 === 1) page.drawRectangle({ x: LEFT, y: y - rowHeight + 5, width: CONTENT_WIDTH, height: rowHeight, color: rgb(0.985, 0.988, 0.99) });
    labelLines.forEach((line, lineIndex) => page.drawText(line, { x: LEFT + 8, y: y - 8 - lineIndex * 12, size: 9, font: regular, color: hasAmount ? ink : muted }));
    if (hasAmount) {
      page.drawLine({ start: { x: RIGHT - 126, y: y - rowHeight + 5 }, end: { x: RIGHT - 126, y }, thickness: 0.5, color: border });
      const amount = Number(row.amount).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      page.drawText(amount, { x: RIGHT - 8 - regular.widthOfTextAtSize(amount, 9), y: y - 8, size: 9, font: bold, color: ink });
    } else if (financialTable) {
      valueLines.forEach((line, lineIndex) => page.drawText(line, { x: LEFT + 8, y: y - 8 - lineIndex * 12, size: 9, font: regular, color: ink }));
    } else {
      const valueX = LEFT + 151;
      valueLines.forEach((line, lineIndex) => page.drawText(line, { x: valueX, y: y - 8 - lineIndex * 12, size: 9, font: regular, color: ink }));
    }
    page.drawLine({ start: { x: LEFT, y: y - rowHeight + 5 }, end: { x: RIGHT, y: y - rowHeight + 5 }, thickness: 0.35, color: border });
    y -= rowHeight;
  };

  startPage();
  let sectionTitle = "Tenant and handover details";
  let rows: string[] = [];
  let financialTable = false;
  const sectionTitles = new Set([
    "Tenant and handover details",
    "Current outstanding bills",
    "Settlement recorded at handover",
    "Deposit and readiness",
    "Agreed costs breakdown",
    "Proposed costs breakdown",
  ]);
  const renderRows = () => {
    if (!rows.length) return;
    drawTableHeader(financialTable ? "Item / status" : "Information", financialTable ? "Amount / value" : "Record");
    rows.forEach((row, index) => drawRow(row, index, financialTable));
    y -= 8;
    rows = [];
  };
  const renderSection = (title: string) => {
    renderRows();
    sectionTitle = title;
    financialTable = ["Current outstanding bills", "Agreed costs breakdown", "Proposed costs breakdown"].includes(title);
    drawSection(title);
  };
  drawSection(sectionTitle);

  for (const raw of input.lines) {
    const line = raw.trim();
    if (!line) { renderRows(); continue; }
    if (sectionTitles.has(line)) { renderSection(line); continue; }
    if (/^REQUIRED:/i.test(line) || /^PRELIMINARY:/i.test(line)) {
      renderRows();
      const text = line.replace(/^(REQUIRED:|PRELIMINARY:)/i, "").trim();
      const lines = wrap(text, CONTENT_WIDTH - 28, 9, regular);
      const height = Math.max(34, lines.length * 13 + 18);
      ensure(height + 4);
      page.drawRectangle({ x: LEFT, y: y - height + 5, width: CONTENT_WIDTH, height, color: amberWash, borderColor: rgb(0.91, 0.77, 0.48), borderWidth: 0.6 });
      page.drawText(/^REQUIRED:/i.test(line) ? "ACTION REQUIRED" : "PRELIMINARY", { x: LEFT + 10, y: y - 10, size: 7, font: bold, color: amber });
      lines.forEach((value, index) => page.drawText(value, { x: LEFT + 10, y: y - 23 - index * 13, size: 9, font: regular, color: ink }));
      y -= height + 7;
      continue;
    }
    rows.push(line);
  }
  renderRows();

  const note = input.closed
    ? "This statement records the handover settlement. Current balances may change when later payments are posted. A refund is complete only when its payment has been recorded. Retain this report with receipts and handover records."
    : "This is a preliminary report. Review final rent, utilities, inspection findings, meter readings, and agreed costs before handover. Proposed refunds and amounts owed remain subject to the final settlement.";
  ensure(155);
  drawSection("Review and verification");
  const noteLines = wrap(note, 352, 9, regular);
  const noteHeight = Math.max(76, noteLines.length * 13 + 28);
  page.drawRectangle({ x: LEFT, y: y - noteHeight + 8, width: 360, height: noteHeight, color: input.closed ? accentWash : amberWash, borderColor: border, borderWidth: 0.5 });
  noteLines.forEach((line, index) => page.drawText(line, { x: LEFT + 11, y: y - 9 - index * 13, size: 9, font: regular, color: ink }));
  const qr = await pdf.embedPng(await createDocumentVerificationQrDataUrl(input.reportUrl));
  const qrX = RIGHT - 104;
  page.drawRectangle({ x: qrX - 7, y: y - 112, width: 104, height: 119, color: white, borderColor: border, borderWidth: 0.7 });
  page.drawImage(qr, { x: qrX, y: y - 97, width: 90, height: 90 });
  page.drawText("SCAN FOR LIVE REPORT", { x: qrX - 2, y: y - 106, size: 6.5, font: bold, color: accent });
  y -= Math.max(noteHeight, 125) + 15;
  const accessCopy = "The QR link opens the current report after authorised sign-in. This PDF is a point-in-time copy.";
  drawWrapped(page, accessCopy, LEFT, y, CONTENT_WIDTH, 8, regular, muted, 11);

  const pages = pdf.getPages();
  pages.forEach((sheet, index) => {
    sheet.drawLine({ start: { x: LEFT, y: 48 }, end: { x: RIGHT, y: 48 }, thickness: 0.6, color: border });
    sheet.drawText(input.closed ? "EstateDesk | Final move-out statement" : "EstateDesk | Preliminary move-out report", { x: LEFT, y: 32, size: 7.5, font: regular, color: muted });
    const pageLabel = `Page ${index + 1} of ${pages.length}`;
    sheet.drawText(pageLabel, { x: RIGHT - regular.widthOfTextAtSize(pageLabel, 7.5), y: 32, size: 7.5, font: regular, color: muted });
  });

  return pdf.save();
}
