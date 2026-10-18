/** Top-level WebView navigation may send Fetch Metadata, unlike native fetch. */
export function isTenantPortalRequest(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  return request.headers.get("x-estatedesk-client") === "native" &&
    !request.headers.has("origin") &&
    (site === null || site === "none");
}
