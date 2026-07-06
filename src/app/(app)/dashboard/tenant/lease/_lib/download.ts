export function tenantLeaseDownloadPath(
  leaseId: string,
  options?: { view?: boolean },
) {
  const path = `/dashboard/tenant/lease/${leaseId}/download`;
  return options?.view ? `${path}?view=1` : path;
}

export function sanitizeDownloadFilename(fileName: string) {
  const trimmed = fileName.trim().replace(/[/\\?%*:|"<>]/g, "-");
  return trimmed.length > 0 ? trimmed : "lease-document.pdf";
}

export function isPdfLeaseAsset(asset: {
  mimeType?: string | null;
  fileType?: string | null;
  fileName?: string | null;
}) {
  const mime = (asset.mimeType ?? asset.fileType ?? "").toLowerCase();

  if (mime.includes("pdf")) {
    return true;
  }

  return (asset.fileName ?? "").toLowerCase().endsWith(".pdf");
}

export function ensurePdfFilename(fileName: string) {
  const sanitized = sanitizeDownloadFilename(fileName);

  if (sanitized.toLowerCase().endsWith(".pdf")) {
    return sanitized;
  }

  const withoutExtension = sanitized.replace(/\.[^.]+$/, "");
  return `${withoutExtension || "lease-document"}.pdf`;
}

export function isPdfBytes(bytes: Uint8Array) {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  );
}