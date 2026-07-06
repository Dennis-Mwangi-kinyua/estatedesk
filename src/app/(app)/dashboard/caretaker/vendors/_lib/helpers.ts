export const VENDORS_LOAD_ERROR_MESSAGE =
  "We couldn't load vendors right now. Please refresh the page or try again in a few minutes.";

export function contactHref(kind: "phone" | "email", value: string | null) {
  if (!value) return null;
  return kind === "email" ? `mailto:${value}` : `tel:${value}`;
}