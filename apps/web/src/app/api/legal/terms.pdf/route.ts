import { NextResponse } from "next/server";
import { termsDescription, termsSections, termsTitle, termsUpdatedAt } from "@/lib/terms";

const pageWidth = 612;
const pageHeight = 792;
const marginX = 54;
const topY = 736;
const bottomY = 54;
const bodySize = 9.5;
const lineHeight = 13;

type PdfPage = {
  lines: Array<{ text: string; size: number; x: number; y: number; bold?: boolean }>;
};

function normalizeText(value: string) {
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function escapePdfText(value: string) {
  return normalizeText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(text: string, maxChars: number) {
  const words = normalizeText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function buildPages() {
  const pages: PdfPage[] = [{ lines: [] }];
  let y = topY;

  function currentPage() {
    return pages[pages.length - 1];
  }

  function nextPage() {
    pages.push({ lines: [] });
    y = topY;
  }

  function addLine(text: string, size = bodySize, options?: { bold?: boolean; gap?: number }) {
    if (y < bottomY) nextPage();

    currentPage().lines.push({
      text,
      size,
      x: marginX,
      y,
      bold: options?.bold,
    });
    y -= options?.gap ?? (size >= 16 ? 20 : lineHeight);
  }

  addLine("EstateDesk", 18, { bold: true, gap: 22 });
  addLine(termsTitle, 16, { bold: true, gap: 18 });
  addLine(`Last updated: ${termsUpdatedAt}`, 10, { gap: 18 });
  for (const line of wrapText(termsDescription, 94)) addLine(line);
  y -= 10;

  for (const section of termsSections) {
    if (y < 110) nextPage();
    addLine(section.title, 12, { bold: true, gap: 18 });

    for (const paragraph of section.body) {
      for (const line of wrapText(paragraph, 98)) addLine(line);
      y -= 5;
    }

    y -= 7;
  }

  pages.forEach((page, index) => {
    page.lines.unshift({
      text: "EstateDesk",
      size: 10,
      x: marginX,
      y: pageHeight - 32,
      bold: true,
    });
    page.lines.push({
      text: `EstateDesk Terms of Service | Page ${index + 1} of ${pages.length}`,
      size: 8,
      x: marginX,
      y: 30,
    });
  });

  return pages;
}

function streamForPage(page: PdfPage) {
  return page.lines
    .map((line) => {
      const font = line.bold ? "F2" : "F1";
      return `BT /${font} ${line.size} Tf ${line.x} ${line.y} Td (${escapePdfText(line.text)}) Tj ET`;
    })
    .join("\n");
}

function createPdf() {
  const pages = buildPages();
  const objects: string[] = [];
  const catalogId = 1;
  const pagesId = 2;
  const fontRegularId = 3;
  const fontBoldId = 4;
  const firstPageId = 5;
  const pageIds = pages.map((_, index) => firstPageId + index * 2);

  objects[catalogId] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  objects[fontRegularId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[fontBoldId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

  pages.forEach((page, index) => {
    const pageId = firstPageId + index * 2;
    const contentId = pageId + 1;
    const stream = streamForPage(page);

    objects[pageId] =
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`;
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = Buffer.byteLength(pdf, "latin1");
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
}

function termsVersionSlug() {
  return termsUpdatedAt
    .toLowerCase()
    .replace(/,/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function GET() {
  return new NextResponse(createPdf(), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="estatedesk-terms-of-service-${termsVersionSlug()}.pdf"`,
      "Cache-Control": "public, max-age=3600",
      "X-Document-Title": termsTitle,
      "X-Document-Updated-At": termsUpdatedAt,
    },
  });
}
