type AuditSource = { entityType: string; entityId: string; metadata: unknown };
export function auditPage(source: AuditSource) {
  const data = source.metadata && typeof source.metadata === "object" ? source.metadata as Record<string, unknown> : {};
  const request = data.request && typeof data.request === "object" ? data.request as Record<string, unknown> : {};
  const value = [data.pathname, data.requestPathname, data.page, data.path, data.url, request.pathname, request.path, request.url, source.entityType === "Route" ? source.entityId : null].find(value => typeof value === "string" && (value.startsWith("/") || /^https?:\/\//.test(value)));
  if (typeof value !== "string") return null;
  try { return new URL(value, "https://estatedesk.invalid").pathname.replace(/(\/(?:sign-lease|accept-invite|reset-password)\/)[^/]+/g, "$1[redacted]"); } catch { return null; }
}
/** Credentials and signature/file payloads must not appear in troubleshooting exports. */
export function auditDetailValue(value: unknown): unknown {
  if (typeof value === "string") return value.replace(/(\/(?:sign-lease|accept-invite|reset-password)\/)[^\s/?"<>]+/g, "$1[redacted]").replace(/([?&](?:token|password|secret|api_key|access_token)=)[^&\s]+/gi, "$1[redacted]");
  if (Array.isArray(value)) return value.map(auditDetailValue);
  if (!value || typeof value !== "object" || value instanceof Date) return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key,
    /password|secret|authorization|cookie|(?:access|refresh|session|signing)[_-]?token|api[_-]?key|private[_-]?key|pdfBase64|imageData|signatureAssetKey|signatureText/i.test(key) || /^token(?:hash)?$/i.test(key) ? "[REDACTED]" : auditDetailValue(item)]));
}
export function auditExport(log: AuditSource & { id: string; createdAt: Date; action: string; [key: string]: unknown }) {
  return { schemaVersion: 1, exportedAt: new Date().toISOString(), page: auditPage(log), pageCaptured: auditPage(log) !== null, log: auditDetailValue(log) };
}
