/** Match the public scheme/host, including when Next runs behind a reverse proxy.
 * Deployment proxies must replace forwarded headers rather than append untrusted input.
 */
export function isSameOriginBrowserMutation(request: Request) {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  if (!origin || site !== null && site !== "same-origin") return false;
  try {
    const parsed = new URL(origin);
    if (parsed.origin !== origin || !["http:", "https:"].includes(parsed.protocol)) return false;
    const internal = new URL(request.url);
    const host = request.headers.get("x-forwarded-host")?.split(",")[0].trim() || request.headers.get("host") || internal.host;
    const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() || internal.protocol.slice(0, -1);
    return parsed.host === host && parsed.protocol === `${protocol}:`;
  } catch { return false; }
}
