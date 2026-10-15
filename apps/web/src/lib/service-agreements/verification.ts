import { createHash } from "node:crypto";
import type { AgreementData } from "./contract";

export function agreementVerificationPath(code: string, hash: string) {
  return `/agreements/verify/${encodeURIComponent(code)}?hash=${encodeURIComponent(hash)}`;
}

export function agreementIntegrity(data: AgreementData, contentHash: string | null) {
  if (!contentHash || createHash("sha256").update(data.body).digest("hex") !== contentHash) return false;
  return [data.platformSignature, data.organizationSignature].every(signature => {
    if (!signature) return true;
    if (signature.contentHash !== contentHash) return false;
    if (!signature.imageData) return !signature.imageHash && signature.method !== "DRAWN" && signature.method !== "UPLOADED";
    if (!signature.imageData.startsWith("data:image/png;base64,") || !signature.imageHash) return false;
    const bytes = Buffer.from(signature.imageData.slice(signature.imageData.indexOf(",") + 1), "base64");
    return createHash("sha256").update(bytes).digest("hex") === signature.imageHash;
  });
}
