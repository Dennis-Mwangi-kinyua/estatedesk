import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

/** A4 document layout with measured text wrapping and automatic page continuation. */
export async function createProfessionalPdf(input: { title: string; serialNumber: string; organizationName: string; issuedAt: Date; verificationUrl?: string; footerText?: string; pageLabel?: string; documentTitle?: string }) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(input.documentTitle ?? `${input.title} ${input.serialNumber}`);
  pdf.setAuthor(input.organizationName);
  pdf.setCreator("EstateDesk Document Trust");
  pdf.setProducer("EstateDesk Document Trust");
  pdf.setCreationDate(input.issuedAt);
  pdf.setModificationDate(input.issuedAt);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(.09, .15, .23), muted = rgb(.31, .37, .45), accent = rgb(.04, .39, .32);
  const border = rgb(.83, .88, .9), wash = rgb(.94, .97, .96);
  const width = 515.28, margin = 40;
  let page = pdf.addPage([595.28, 841.89]);
  let y = 0;
  const safe = (text: string) => Array.from(String(text).normalize("NFC")).map(char => { try { regular.encodeText(char); return char; } catch { return `[U+${char.codePointAt(0)!.toString(16).toUpperCase()}]`; } }).join("");
  function wrap(text: string, available: number, size = 9, strong = false) {
    const font = strong ? bold : regular;
    const result: string[] = [];
    for (const paragraph of safe(text).split(/\r?\n/)) {
      let line = "";
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        const candidate = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) <= available) { line = candidate; continue; }
        if (line) { result.push(line); line = ""; }
        for (const char of word) {
          if (line && font.widthOfTextAtSize(line + char, size) > available) { result.push(line); line = ""; }
          line += char;
        }
      }
      result.push(line);
    }
    return result;
  }
  function header() {
    page.drawRectangle({ x: 0, y: 0, width: 595.28, height: 841.89, color: rgb(1, 1, 1) });
    page.drawRectangle({ x: margin, y: 776, width, height: 26, color: accent });
    page.drawText(safe(input.title.toUpperCase()), { x: margin + 12, y: 784, size: 12, font: bold, color: rgb(1, 1, 1) });
    y = 758;
    for (const text of wrap(`Document number: ${input.serialNumber}`, width, 8)) { page.drawText(text, { x: margin, y, size: 8, font: regular, color: muted }); y -= 12; }
    y -= 8;
  }
  header();
  function ensure(height: number) {
    if (y - height < 64) { page = pdf.addPage([595.28, 841.89]); header(); return true; }
    return false;
  }
  function paragraph(text: string, options: { strong?: boolean; size?: number; accent?: boolean } = {}) {
    const size = options.size ?? 9;
    for (const value of wrap(text, width, size, options.strong)) {
      ensure(size + 6);
      page.drawText(value, { x: margin, y, size, font: options.strong ? bold : regular, color: options.accent ? accent : ink });
      y -= size + 5;
    }
    y -= 5;
  }
  function section(title: string) {
    ensure(54);
    y -= 4;
    page.drawRectangle({ x: margin, y: y - 6, width, height: 23, color: wash });
    page.drawText(safe(title.toUpperCase()), { x: margin + 9, y: y + 1, size: 9, font: bold, color: accent });
    y -= 21;
  }
  function details(items: Array<[string, string | null | undefined]>) {
    for (const [label, raw] of items) {
      const lines = wrap(raw || "Not supplied", width - 154, 9);
      ensure(Math.min(lines.length * 14 + 10, 80));
      page.drawText(safe(label), { x: margin + 4, y, size: 8, font: regular, color: muted });
      for (const line of lines) { ensure(16); page.drawText(line, { x: margin + 154, y, size: 9, font: bold, color: ink }); y -= 14; }
      page.drawLine({ start: { x: margin, y: y + 3 }, end: { x: margin + width, y: y + 3 }, thickness: .5, color: border });
      y -= 9;
    }
  }
  function table(columns: Array<{ label: string; width: number; right?: boolean }>, rows: string[][]) {
    function tableHeader() {
      ensure(36);
      page.drawRectangle({ x: margin, y: y - 9, width, height: 24, color: wash });
      let x = margin;
      for (const col of columns) { page.drawText(safe(col.label), { x: x + 7, y, size: 8, font: bold, color: accent }); x += col.width; }
      y -= 27;
    }
    tableHeader();
    rows.forEach((row, rowIndex) => {
      const cells = columns.map((col, i) => wrap(row[i] ?? "", col.width - 14, 9));
      const count = Math.max(...cells.map(lines => lines.length));
      ensure(Math.min(count * 14 + 10, 80)) && tableHeader();
      for (let lineIndex = 0; lineIndex < count; lineIndex++) {
        if (ensure(22)) tableHeader();
        if (rowIndex % 2 === 0) page.drawRectangle({ x: margin, y: y - 4, width, height: 14, color: rgb(.98, .99, .99) });
        let x = margin;
        columns.forEach((col, i) => {
          const text = cells[i][lineIndex] ?? "";
          const drawX = col.right ? x + col.width - 7 - regular.widthOfTextAtSize(text, 9) : x + 7;
          page.drawText(text, { x: drawX, y, size: 9, font: regular, color: ink }); x += col.width;
        });
        y -= 14;
      }
      y -= 8;
    });
  }
  async function verification(note: string) {
    if (!input.verificationUrl) throw new Error("A verification URL is required for this document.");
    ensure(140);
    section("Document verification");
    const qr = await pdf.embedPng(await QRCode.toBuffer(input.verificationUrl, { type: "png", width: 240, margin: 1, errorCorrectionLevel: "M" }));
    page.drawImage(qr, { x: margin, y: y - 80, width: 80, height: 80 });
    let textY = y - 10;
    for (const line of wrap(note, width - 112, 9)) { page.drawText(line, { x: margin + 110, y: textY, size: 9, font: regular, color: ink }); textY -= 14; }
    y -= Math.max(90, y - textY + 10);
    paragraph(input.verificationUrl, { size: 8 });
  }
  async function save() {
    const pages = pdf.getPages();
    pages.forEach((p, index) => {
      p.drawLine({ start: { x: margin, y: 48 }, end: { x: margin + width, y: 48 }, thickness: .6, color: border });
      p.drawText(safe(input.footerText ?? "EstateDesk | Digitally issued; no handwritten signature required."), { x: margin, y: 33, size: 7, font: regular, color: muted });
      const value = `${input.pageLabel ?? "Page"} ${index + 1} of ${pages.length}`;
      p.drawText(value, { x: margin + width - regular.widthOfTextAtSize(value, 7), y: 33, size: 7, font: regular, color: muted });
    });
    return pdf.save({ useObjectStreams: false, addDefaultPage: false });
  }
  return { paragraph, section, details, table, verification, save };
}
