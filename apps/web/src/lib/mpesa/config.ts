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
    return Object.values(config).every(Boolean) ? [config] : [];
  });
}

export function getMpesaConfigForOrg(orgId?: string | null) {
  if (!orgId) return undefined;
  const matches = getMpesaConfigs().filter(config => config.orgId === orgId);
  return matches.length === 1 ? matches[0] : undefined;
}

export function getMpesaConfigForCallback(secret: string | null) {
  if (!secret) return undefined;
  const matches = getMpesaConfigs().filter(config => config.callbackSecret === secret);
  return matches.length === 1 ? getMpesaConfigForOrg(matches[0].orgId) : undefined;
}
