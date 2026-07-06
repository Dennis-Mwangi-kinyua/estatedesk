export const DOCUMENTS_LOAD_ERROR_MESSAGE =
  "We couldn't load documents right now. Please refresh the page or try again in a few minutes.";

export function formatDocumentType(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

export function publicAssetUrl(key: string) {
  if (key.startsWith("/") || key.startsWith("http")) return key;
  return `/${key.replace(/^public\//, "")}`;
}