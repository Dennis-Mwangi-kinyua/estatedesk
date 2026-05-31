import { z } from "zod";

const fallbackDatasourceUrl = "postgresql://user:password@localhost:5432/estatedesk";
const legacyPgSslModes = new Set(["prefer", "require", "verify-ca"]);

export type RuntimeEnvKey =
  | "DATABASE_URL"
  | "DIRECT_URL"
  | "NEXT_PUBLIC_APP_URL"
  | "APP_URL"
  | "AUTH_SECRET"
  | "CRON_SECRET"
  | "PLATFORM_API_KEYS_PAGE_PASSWORD"
  | "S3_BUCKET"
  | "S3_REGION"
  | "S3_ENDPOINT"
  | "S3_PUBLIC_BASE_URL"
  | "S3_ACCESS_KEY_ID"
  | "S3_SECRET_ACCESS_KEY"
  | "WHATSAPP_PROVIDER"
  | "WHATSAPP_BUSINESS_ACCOUNT_ID"
  | "WHATSAPP_PHONE_NUMBER_ID"
  | "WHATSAPP_ACCESS_TOKEN"
  | "WHATSAPP_VERIFY_TOKEN"
  | "WHATSAPP_DISPLAY_NAME"
  | "WHATSAPP_GRAPH_VERSION"
  | "WHATSAPP_TEMPLATE_LANGUAGE"
  | "WHATSAPP_INVITE_TEMPLATE_NAME"
  | "WHATSAPP_CREDENTIALS_TEMPLATE_NAME";

type EnvCheck = {
  key: RuntimeEnvKey;
  label: string;
  group: "Core" | "Security" | "Storage" | "Messaging";
  importance: "required" | "recommended" | "optional";
};

export const runtimeEnvChecks = [
  {
    key: "DATABASE_URL",
    label: "Database",
    group: "Core",
    importance: "required",
  },
  {
    key: "AUTH_SECRET",
    label: "Cookie signing secret",
    group: "Security",
    importance: "recommended",
  },
  {
    key: "CRON_SECRET",
    label: "Cron endpoint secret",
    group: "Security",
    importance: "required",
  },
  {
    key: "PLATFORM_API_KEYS_PAGE_PASSWORD",
    label: "Platform API key vault password",
    group: "Security",
    importance: "required",
  },
  {
    key: "NEXT_PUBLIC_APP_URL",
    label: "Public app URL",
    group: "Core",
    importance: "recommended",
  },
  {
    key: "S3_BUCKET",
    label: "S3 bucket",
    group: "Storage",
    importance: "recommended",
  },
  {
    key: "S3_REGION",
    label: "S3 region",
    group: "Storage",
    importance: "recommended",
  },
  {
    key: "S3_ACCESS_KEY_ID",
    label: "S3 access key",
    group: "Storage",
    importance: "recommended",
  },
  {
    key: "S3_SECRET_ACCESS_KEY",
    label: "S3 secret key",
    group: "Storage",
    importance: "recommended",
  },
  {
    key: "S3_PUBLIC_BASE_URL",
    label: "S3 public base URL",
    group: "Storage",
    importance: "optional",
  },
  {
    key: "WHATSAPP_PROVIDER",
    label: "WhatsApp provider",
    group: "Messaging",
    importance: "recommended",
  },
  {
    key: "WHATSAPP_PHONE_NUMBER_ID",
    label: "Meta WhatsApp phone number",
    group: "Messaging",
    importance: "recommended",
  },
  {
    key: "WHATSAPP_ACCESS_TOKEN",
    label: "Meta WhatsApp access token",
    group: "Messaging",
    importance: "recommended",
  },
  {
    key: "WHATSAPP_VERIFY_TOKEN",
    label: "Meta webhook verify token",
    group: "Messaging",
    importance: "optional",
  },
  {
    key: "WHATSAPP_BUSINESS_ACCOUNT_ID",
    label: "Meta business account",
    group: "Messaging",
    importance: "optional",
  },
  {
    key: "WHATSAPP_DISPLAY_NAME",
    label: "WhatsApp display name",
    group: "Messaging",
    importance: "optional",
  },
  {
    key: "WHATSAPP_GRAPH_VERSION",
    label: "Meta Graph version",
    group: "Messaging",
    importance: "optional",
  },
  {
    key: "WHATSAPP_TEMPLATE_LANGUAGE",
    label: "WhatsApp template language",
    group: "Messaging",
    importance: "optional",
  },
  {
    key: "WHATSAPP_INVITE_TEMPLATE_NAME",
    label: "Invite template",
    group: "Messaging",
    importance: "optional",
  },
  {
    key: "WHATSAPP_CREDENTIALS_TEMPLATE_NAME",
    label: "Credentials template",
    group: "Messaging",
    importance: "optional",
  },
] satisfies EnvCheck[];

const urlSchema = z.string().url();

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function getEnvValue(key: RuntimeEnvKey) {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

export function requireEnvValue(key: RuntimeEnvKey) {
  const value = getEnvValue(key);

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export function normalizeDatabaseUrlSslMode(databaseUrl: string) {
  try {
    const parsed = new URL(databaseUrl);
    const isPostgres =
      parsed.protocol === "postgresql:" || parsed.protocol === "postgres:";
    const usesLibpqCompatibility =
      parsed.searchParams.get("uselibpqcompat") === "true";
    const sslMode = parsed.searchParams.get("sslmode")?.toLowerCase();

    if (
      isPostgres &&
      sslMode &&
      legacyPgSslModes.has(sslMode) &&
      !usesLibpqCompatibility
    ) {
      parsed.searchParams.set("sslmode", "verify-full");
      return parsed.toString();
    }
  } catch {
    return databaseUrl;
  }

  return databaseUrl;
}

export function getDatabaseUrl() {
  const databaseUrl = getEnvValue("DIRECT_URL") ?? getEnvValue("DATABASE_URL");

  if (databaseUrl) {
    return normalizeDatabaseUrlSslMode(databaseUrl);
  }

  if (isProduction()) {
    throw new Error(
      "DATABASE_URL or DIRECT_URL must be configured in production.",
    );
  }

  return fallbackDatasourceUrl;
}

export function getAppBaseUrl() {
  const appUrl = getEnvValue("NEXT_PUBLIC_APP_URL") ?? getEnvValue("APP_URL");

  if (!appUrl) return undefined;

  const parsed = urlSchema.safeParse(appUrl);
  return parsed.success ? parsed.data.replace(/\/$/, "") : undefined;
}

export function getStorageConfig() {
  const bucket = requireEnvValue("S3_BUCKET");
  const region = requireEnvValue("S3_REGION");
  const endpoint = getEnvValue("S3_ENDPOINT");
  const publicBaseUrl = getEnvValue("S3_PUBLIC_BASE_URL") ?? "";
  const accessKeyId = getEnvValue("S3_ACCESS_KEY_ID");
  const secretAccessKey = getEnvValue("S3_SECRET_ACCESS_KEY");

  if ((accessKeyId && !secretAccessKey) || (!accessKeyId && secretAccessKey)) {
    throw new Error(
      "S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY must be configured together.",
    );
  }

  return {
    bucket,
    region,
    endpoint,
    publicBaseUrl,
    credentials:
      accessKeyId && secretAccessKey
        ? {
            accessKeyId,
            secretAccessKey,
          }
        : undefined,
  };
}

export function getRuntimeEnvReport() {
  const checks = runtimeEnvChecks.map((check) => {
    const configured = Boolean(getEnvValue(check.key));

    return {
      ...check,
      configured,
      status: configured
        ? ("configured" as const)
        : check.importance === "required"
          ? ("missing-required" as const)
          : ("missing" as const),
    };
  });

  const configured = checks.filter((check) => check.configured).length;
  const missingRequired = checks.filter(
    (check) => check.status === "missing-required",
  ).length;

  return {
    checks,
    configured,
    total: checks.length,
    missingRequired,
    ready: missingRequired === 0,
  };
}
