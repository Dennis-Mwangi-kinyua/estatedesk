export const DATA_EXPORT_REASON_MIN_LENGTH = 50;
export const DATA_EXPORT_REASON_MAX_LENGTH = 1200;
export type DataExportDeliveryMethod = "DOWNLOAD" | "EMAIL";

export function isDataExportDeliveryMethod(method: string): method is DataExportDeliveryMethod {
  return method === "DOWNLOAD" || method === "EMAIL";
}

export function validateDataExportReason(reason: string | null) {
  if (!reason || reason.length < DATA_EXPORT_REASON_MIN_LENGTH) {
    return `Please provide a detailed reason of at least ${DATA_EXPORT_REASON_MIN_LENGTH} characters.`;
  }
  if (reason.length > DATA_EXPORT_REASON_MAX_LENGTH) {
    return `The export request reason must be ${DATA_EXPORT_REASON_MAX_LENGTH.toLocaleString("en-US")} characters or fewer.`;
  }
  return null;
}

export function validateDataExportDelivery(method: string, email: string | null) {
  if (!isDataExportDeliveryMethod(method)) {
    return "Choose download or email delivery for the export.";
  }
  if (method === "EMAIL" && (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return "Enter a valid email address for CSV delivery.";
  }
  return null;
}
