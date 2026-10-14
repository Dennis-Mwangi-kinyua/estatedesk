/** Private HTML uses a fresh nonce. Public HTML remains compatible with static rendering. */
export function contentSecurityPolicy({ nonce, development = false }: { nonce?: string; development?: boolean } = {}) {
  const scripts = ["'self'", nonce ? `'nonce-${nonce}'` : "'unsafe-inline'", development ? "'unsafe-eval'" : "", "https://www.googletagmanager.com", "https://www.google-analytics.com", "https://www.googleadservices.com", "https://googleads.g.doubleclick.net"].filter(Boolean).join(" ");
  return [
    "default-src 'self'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'", "object-src 'none'",
    "img-src 'self' data: blob: https:", "font-src 'self' data:", "style-src 'self' 'unsafe-inline'",
    `script-src ${scripts}`, "script-src-attr 'none'",
    "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://stats.g.doubleclick.net",
    "frame-src https://www.googletagmanager.com https://td.doubleclick.net", "worker-src 'self' blob:",
    development ? "" : "upgrade-insecure-requests",
  ].filter(Boolean).join("; ");
}
