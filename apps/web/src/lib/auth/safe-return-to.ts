const INTERNAL_ORIGIN = "https://estatedesk.invalid";

/** Accept only same-origin application paths for user supplied return targets. */
export function safeReturnTo(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/")) return null;
  if (/^[\/]{2}|[\\\u0000-\u001f\u007f]|%2f|%5c/i.test(value)) return null;

  try {
    const target = new URL(value, INTERNAL_ORIGIN);
    if (target.origin !== INTERNAL_ORIGIN || target.username || target.password) return null;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return null;
  }
}
