import { readFile } from "node:fs/promises";
import { createSign } from "node:crypto";
import { pathToFileURL } from "node:url";

class SitemapSubmissionError extends Error {}

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
export function serviceAccountAssertion(credentials, now = Math.floor(Date.now() / 1000)) {
  if (credentials.type !== "service_account" || !credentials.client_email || !credentials.private_key) throw new SitemapSubmissionError("Valid Google service-account credentials are required.");
  const input = `${encode({ alg: "RS256", typ: "JWT", ...(credentials.private_key_id ? { kid: credentials.private_key_id } : {}) })}.${encode({ iss: credentials.client_email, scope: "https://www.googleapis.com/auth/webmasters", aud: TOKEN_URL, iat: now, exp: now + 3600 })}`;
  return `${input}.${createSign("RSA-SHA256").update(input).sign(credentials.private_key, "base64url")}`;
}

/** @param {Record<string, string | undefined>} [env] @param {typeof fetch} [fetcher] */
export async function submitSitemaps(env = process.env, fetcher = fetch) {
  const base = new URL(env.APP_URL || env.NEXT_PUBLIC_APP_URL || "https://estatedesk.co.ke");
  if (base.protocol !== "https:") throw new SitemapSubmissionError("Sitemap submission requires an HTTPS site URL.");
  const sitemap = new URL("/sitemap-index.xml", base).href;
  let configured = 0;
  if (env.GOOGLE_SEARCH_CONSOLE_CREDENTIALS || env.GOOGLE_APPLICATION_CREDENTIALS) {
    configured++;
    const credentials = JSON.parse(env.GOOGLE_SEARCH_CONSOLE_CREDENTIALS || await readFile(env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"));
    const tokenResponse = await fetcher(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: serviceAccountAssertion(credentials) }), signal: AbortSignal.timeout(30_000) });
    if (!tokenResponse.ok) throw new SitemapSubmissionError(`Google authentication failed (${tokenResponse.status}).`);
    const token = (await tokenResponse.json()).access_token;
    if (typeof token !== "string" || !token) throw new SitemapSubmissionError("Google returned no access token.");
    const property = env.GOOGLE_SEARCH_CONSOLE_SITE_URL || base.origin + "/";
    const response = await fetcher(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/sitemaps/${encodeURIComponent(sitemap)}`, { method: "PUT", headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new SitemapSubmissionError(`Google sitemap submission failed (${response.status}). Check property access.`);
    console.log("Google: sitemap submitted successfully.");
  } else console.log("Google: not submitted; service-account access is not configured.");
  if (env.BING_WEBMASTER_API_KEY) {
    configured++;
    const endpoint = new URL("https://ssl.bing.com/webmaster/api.svc/json/SubmitFeed");
    endpoint.searchParams.set("apikey", env.BING_WEBMASTER_API_KEY);
    const response = await fetcher(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ siteUrl: base.origin + "/", feedUrl: sitemap }), signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new SitemapSubmissionError(`Bing sitemap submission failed (${response.status}). Check property access.`);
    const body = await response.json();
    if (body?.ErrorCode || body?.error) throw new SitemapSubmissionError("Bing rejected the sitemap submission.");
    console.log("Bing: sitemap submitted successfully.");
  } else console.log("Bing: not submitted; Webmaster API access is not configured.");
  if (!configured) throw new SitemapSubmissionError("No search-engine credentials are configured. No submissions were made.");
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  void submitSitemaps().catch((error) => {
    // Never include request URLs, credentials, private keys, or token response bodies in logs.
    console.error(error instanceof SitemapSubmissionError ? error.message : "Sitemap submission failed; check connectivity and credentials.");
    process.exitCode = 1;
  });
}
