import "dotenv/config";
import { defineConfig } from "prisma/config";

const fallbackDatasourceUrl = "postgresql://user:password@localhost:5432/estatedesk";
const legacyPgSslModes = new Set(["prefer", "require", "verify-ca"]);

function normalizeDatabaseUrlSslMode(databaseUrl: string) {
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

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: normalizeDatabaseUrlSslMode(
      process.env.DIRECT_URL ??
        process.env.DATABASE_URL ??
        fallbackDatasourceUrl,
    ),
  },
});
