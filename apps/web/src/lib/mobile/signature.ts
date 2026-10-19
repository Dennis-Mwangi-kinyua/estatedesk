import { readElectronicSignature } from "@/lib/uploads/electronic-signature";

/** Share the website's PNG validation, dimensions, decoding and evidence hash. */
export async function nativeSignature(value: { signatureMethod?: string; signatureData?: string }) {
  const method = value.signatureMethod ?? "TYPED";
  const form = new FormData();
  form.set("signatureMethod", method);
  if (method !== "TYPED") {
    const data = value.signatureData ?? "";
    if (data.length > 350000 || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(data)) throw new Error("Draw or choose a PNG signature before signing.");
    if (method === "UPLOADED") form.set("signatureFile", new File([Buffer.from(data.slice(data.indexOf(",") + 1), "base64")], "signature.png", { type: "image/png" }));
    else form.set("signatureData", data);
  }
  try { return await readElectronicSignature(form); }
  catch { throw new Error("Signature image must be a valid PNG under 256 KB and no larger than 2048 × 2048 pixels."); }
}
