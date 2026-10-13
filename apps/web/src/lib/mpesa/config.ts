export type MpesaConfig = {
  orgId: string;
  environment: "sandbox" | "production";
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  callbackSecret: string;
  callbackUrl: string;
};

function isSafeCallbackUrl(value: string, secret: string) {
  try {
    const url = new URL(value);
    const appUrlValue = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_URL?.trim();
    const appUrl = appUrlValue ? new URL(appUrlValue) : null;
    return url.protocol === "https:" &&
      !url.username && !url.password && !url.hash &&
      url.pathname === "/api/webhooks/mpesa" &&
      url.searchParams.get("secret") === secret &&
      (appUrl
        ? appUrl.protocol === "https:" && url.origin === appUrl.origin
        : process.env.NODE_ENV !== "production");
  } catch {
    return false;
  }
}

export function getMpesaConfigs(): MpesaConfig[] {
  const prefixes = ["MPESA", ...(process.env.MPESA_ADDITIONAL_PREFIXES ?? "").split(",").map(value => value.trim()).filter(value => /^[A-Z][A-Z0-9_]+$/.test(value) && value !== "MPESA")];
  return [...new Set(prefixes)].flatMap(prefix => {
    const read = (key: string) => process.env[`${prefix}_${key}`]?.trim() ?? "";
    const config: MpesaConfig = {
      orgId: read("ORG_ID"),
      environment: read("ENVIRONMENT") === "production" ? "production" : "sandbox",
      consumerKey: read("CONSUMER_KEY"),
      consumerSecret: read("CONSUMER_SECRET"),
      shortcode: read("SHORTCODE"),
      passkey: read("PASSKEY"),
      callbackSecret: read("CALLBACK_SECRET"),
      callbackUrl: read("CALLBACK_URL"),
    };
    return Object.values(config).every(Boolean) && isSafeCallbackUrl(config.callbackUrl, config.callbackSecret)
      ? [config]
      : [];
  });
}

export function getMpesaConfigForOrg(orgId?: string | null) {
  if (!orgId) return undefined;
  const matches = getMpesaConfigs().filter(config => config.orgId === orgId);
  return matches.length === 1 ? matches[0] : undefined;
}

export function isMpesaStkConfigured(orgId?: string | null) {
  return Boolean(getMpesaConfigForOrg(orgId));
}
