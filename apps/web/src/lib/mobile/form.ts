import { z } from "zod";
import { validateImageFile } from "@/lib/uploads/secure-image";
import { PayloadTooLargeError } from "@/lib/security/bounded-json";

/** Bound multipart bytes before parsing, including chunked requests. */
export async function nativeForm<T>(request: Request, schema: z.ZodType<T>, photoFields: readonly string[] = ["photo"]) {
  if (request.headers.get("content-type")?.startsWith("application/json")) {
    const { nativeBody } = await import("./route");
    const input = await nativeBody(request, schema);
    const form = new FormData();
    for (const [key, value] of Object.entries(input as object)) form.set(key, String(value));
    return { input, form };
  }
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data;")) throw new SyntaxError("Multipart or JSON required.");
  const max = 3_700_000;
  if (Number(request.headers.get("content-length")) > max) throw new PayloadTooLargeError();
  if (!request.body) throw new SyntaxError("Missing payload.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) { await reader.cancel(); throw new PayloadTooLargeError(); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let form: FormData;
  try { form = await new Response(bytes, { headers: { "Content-Type": request.headers.get("content-type")! } }).formData(); }
  catch { throw new SyntaxError("Invalid multipart payload."); }
  const raw = Object.fromEntries(form);
  const input = schema.parse({ ...raw, ...(raw.currentReading !== undefined ? { currentReading: typeof raw.currentReading === "string" && raw.currentReading.trim() ? Number(raw.currentReading) : NaN } : {}) });
  // Reject unknown file fields and repeated fields instead of silently ignoring evidence.
  const seen = new Set<string>();
  for (const [key, value] of form) {
    if (seen.has(key)) throw new SyntaxError("Duplicate field.");
    seen.add(key);
    if (value instanceof File) {
      if (!photoFields.includes(key) || value.size > 2 * 1024 * 1024) throw new SyntaxError("Invalid attachment.");
      try { await validateImageFile(value, { maxBytes: 2 * 1024 * 1024 }); } catch { throw new SyntaxError("Choose a JPEG, PNG or WebP evidence photo under 2MB."); }
    }
  }
  return { input, form };
}
