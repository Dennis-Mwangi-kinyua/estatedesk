import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { readElectronicSignature } from "../../apps/web/src/lib/uploads/electronic-signature";
import { createProfessionalPdf } from "../../apps/web/src/lib/documents/professional-pdf";

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==", "base64");
test("drawn and uploaded signatures retain validated image bytes and their evidence hash", async () => {
  for (const method of ["DRAWN", "UPLOADED"]) {
    const form = new FormData();
    form.set("signatureMethod", method);
    if (method === "DRAWN") form.set("signatureData", `data:image/png;base64,${png.toString("base64")}`);
    else form.set("signatureFile", new File([png], "signature.png", { type: "image/png" }));
    const signature = await readElectronicSignature(form);
    assert.equal(signature.method, method);
    assert.deepEqual(signature.bytes, png);
    assert.equal(signature.imageHash, createHash("sha256").update(png).digest("hex"));
    const pdf = await createProfessionalPdf({ title: "Signature test", serialNumber: "TEST", organizationName: "Test", issuedAt: new Date() });
    await pdf.signatureImage(signature.imageData!);
    assert.equal((await PDFDocument.load(await pdf.save())).getPageCount(), 1);
  }
});
test("typed signatures remain compatible; missing, malformed, oversized, and unsupported images are rejected", async () => {
  assert.deepEqual(await readElectronicSignature(new FormData()), { method: "TYPED" });
  for (const [method, data] of [["INVALID", ""], ["DRAWN", ""], ["DRAWN", "data:image/png;base64,aGVsbG8="], ["DRAWN", `data:image/png;base64,${'A'.repeat(350_001)}`], ["UPLOADED", ""]]) {
    const form = new FormData(); form.set("signatureMethod", method); form.set("signatureData", data);
    await assert.rejects(readElectronicSignature(form));
  }
  const large = Buffer.from(png); large.writeUInt32BE(100_000, 16);
  const form = new FormData(); form.set("signatureMethod", "DRAWN"); form.set("signatureData", `data:image/png;base64,${large.toString("base64")}`);
  await assert.rejects(readElectronicSignature(form), /2048/);
});
