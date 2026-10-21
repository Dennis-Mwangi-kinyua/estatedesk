export function maskedDocumentIdentity(name?: string | null) {
  if (!name?.trim()) return "Identity withheld";
  return name.trim().split(/\s+/).map(part => `${Array.from(part)[0]}***`).join(" ");
}
export function publicVerificationSummary(document: { documentType: string; status: string; expiresAt: Date | null; serialNumber: string; issuedAt: Date; contentHash: string | null }, identity?: string | null) {
  return { type: document.documentType, valid: !document.expiresAt || document.expiresAt > new Date() ? ["ISSUED", "COMPLETED"].includes(document.status) : false,
    status: document.expiresAt && document.expiresAt <= new Date() ? "EXPIRED" : document.status,
    serialNumber: document.serialNumber, issuedAt: document.issuedAt, fingerprint: document.contentHash, identity: maskedDocumentIdentity(identity) };
}
