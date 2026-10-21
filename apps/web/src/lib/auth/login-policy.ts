import { createHash } from "node:crypto";
import { isIP } from "node:net";

const TRUSTED_HEADERS = new Set(["x-forwarded-for", "x-real-ip", "x-vercel-forwarded-for", "cf-connecting-ip"]);
/** Only opt in when the ingress proxy overwrites this header and direct access is blocked. */
export function trustedLoginIp(headers: Pick<Headers, "get">, configuredHeader = process.env.TRUSTED_CLIENT_IP_HEADER): string {
  const name = configuredHeader?.trim().toLowerCase();
  if (!name || !TRUSTED_HEADERS.has(name)) return "unknown";
  const value = headers.get(name)?.split(",")[0]?.trim();
  return value && isIP(value) ? value : "unknown";
}
export function loginRateLimits(identifier: string, ip: string) {
  const account = createHash("sha256").update(identifier.trim().toLowerCase()).digest("hex");
  return [
    { key: `login-ip:${ip}`, limit: 30, windowMs: 60_000 },
    { key: `login-pair:${ip}:${account}`, limit: 8, windowMs: 60_000 },
    { key: `login-identifier:${account}`, limit: 20, windowMs: 15 * 60_000 },
  ];
}
export function accountLoginRateLimit(userId: string) {
  // Email and username aliases for the same account share this bucket.
  return { key: `login-user:${userId}`, limit: 20, windowMs: 15 * 60_000 };
}
