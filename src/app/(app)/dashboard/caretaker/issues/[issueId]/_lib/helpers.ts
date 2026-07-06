export const ISSUE_DETAIL_LOAD_ERROR_MESSAGE =
  "We couldn't load this issue right now. Please refresh the page or try again in a few minutes.";

export function phoneHref(value: string | null | undefined) {
  return value ? `tel:${value}` : null;
}

export function getIssuePhotoUrl(key: string) {
  if (key.startsWith("/") || key.startsWith("http")) return key;
  return `/${key.replace(/^public\//, "")}`;
}