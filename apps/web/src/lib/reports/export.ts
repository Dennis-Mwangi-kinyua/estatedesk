import { PDFDocument, StandardFonts } from "pdf-lib";
import type { NativeWorkspaceRecord, ReportMetadata } from "@estatedesk/contracts/mobile";

export function reportExportRows(data: { records: NativeWorkspaceRecord[]; report: ReportMetadata }) {
  const r = data.report;
  return [
    ["EstateDesk platform report", r.scopeName], ["Generated at", r.generatedAt],
    ["Timezone", "Africa/Nairobi"], ["Current interval (inclusive start, exclusive end)", r.windowStart, r.windowEnd],
    ["Previous interval (inclusive start, exclusive end)", r.previousStart, r.previousEnd],
    ["Basis", "Activity created during each interval, using current statuses. Attention is current backlog across all dates."],
    ...data.records.flatMap(record => [[record.title, record.subtitle], ...record.fields.map(field => [record.title, field.label, field.value])]),
    ["Organization drilldown", r.metric], ["Organization", "Current count", "Previous count", "Current backlog items", "Currency", "Current verified volume", "Previous verified volume"],
    ...r.organizations.flatMap(org => (org.amounts.length ? org.amounts : [{ currency: "", current: "", previous: "" }]).map(amount => [org.name, String(org.current), String(org.previous), String(org.attention), amount.currency, amount.current, amount.previous])),
  ];
}
export function reportCsv(rows: string[][]) {
  // Quoting alone does not prevent spreadsheet formulas.
  return '\uFEFF' + rows.map(row => row.map(value => `"${(/^[\s]*[=+\-@\t\r]/.test(value) ? "'" + value : value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
}
export async function reportPdf(rows: string[][]) {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  let page = document.addPage([595, 842]), y = 800;
  for (const row of rows) {
    const text = row.join(" | ").normalize("NFKD").replace(/[^\x20-\x7E]/g, " ");
    const words = text.split(/\s+/).flatMap(word => word.match(/.{1,80}/g) ?? []);
    let line = "";
    const write = () => { if (y < 45) { page = document.addPage([595, 842]); y = 800; } page.drawText(line, { x: 36, y, size: 10, font }); y -= 15; line = ""; };
    for (const word of words) { const next = line ? `${line} ${word}` : word; if (font.widthOfTextAtSize(next, 10) > 520 && line) write(); line += (line ? " " : "") + word; }
    if (line) write();
    y -= 4;
  }
  return document.save();
}
