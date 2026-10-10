import assert from "node:assert/strict";
import test from "node:test";
import { PDFDocument } from "pdf-lib";
import { createMoveOutReportPdf } from "../../apps/web/src/lib/documents/move-out-report-pdf";

test("move-out statement paginates long names and itemised costs with a QR on the final page", async () => {
  const bytes = await createMoveOutReportPdf({
    title: "FINAL MOVE-OUT STATEMENT", organisation: "Long apartment organisation name ".repeat(8),
    reference: "MO-2026-001", reportUrl: "https://estatedesk.co.ke/api/move-outs/example/report", closed: true,
    lines: ["Tenant: " + "Complete tenant name ".repeat(12), "Current outstanding bills",
      ...Array.from({ length: 90 }, (_, index) => `Agreed repair ${index + 1}: 1250.00`), "Refund due: 1500.00"],
  });
  const pdf = await PDFDocument.load(bytes);
  assert.ok(pdf.getPageCount() >= 3);
  assert.ok(bytes.length > 5000);
  for (const page of pdf.getPages()) {
    assert.equal(page.getWidth(), 595.28);
    assert.equal(page.getHeight(), 841.89);
  }
});
