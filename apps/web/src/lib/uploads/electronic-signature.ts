import { createHash } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { validateImageBytes, validateImageFile } from "./secure-image";

export async function readElectronicSignature(form: FormData): Promise<{ method: "TYPED" | "DRAWN" | "UPLOADED"; bytes?: Buffer; imageData?: string; imageHash?: string }> {
  const method = String(form.get("signatureMethod") ?? "TYPED");
  if (method === "TYPED") return { method: "TYPED" as const };
  if (method !== "DRAWN" && method !== "UPLOADED") throw new Error("Choose a valid signature method.");
  const options = { maxBytes: 256 * 1024, allowedMimeTypes: ["image/png"] };
  let bytes: Buffer;
  if (method === "DRAWN") {
    const data = String(form.get("signatureData") ?? "");
    if (data.length > 350_000 || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(data)) throw new Error("Draw your signature before signing.");
    bytes = validateImageBytes(Buffer.from(data.slice(data.indexOf(",") + 1), "base64"), options).buffer;
  } else {
    const file = form.get("signatureFile");
    if (!(file instanceof File)) throw new Error("Upload a PNG signature image.");
    bytes = (await validateImageFile(file, options)).buffer;
  }
  // Read dimensions before decoding to keep uploaded images within a signature-sized canvas.
  if (bytes.length < 24 || bytes.toString("ascii", 12, 16) !== "IHDR") throw new Error("Invalid PNG signature.");
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  if (!width || !height || width > 2048 || height > 2048) throw new Error("Signature images must be no larger than 2048 × 2048 pixels.");
  const pdf = await PDFDocument.create();
  await pdf.embedPng(bytes);
  return { method, bytes, imageData: `data:image/png;base64,${bytes.toString("base64")}`, imageHash: createHash("sha256").update(bytes).digest("hex") };
}
