import "dotenv/config";
import dns from "node:dns";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getDatabaseUrl } from "@/lib/config/env";

dns.setDefaultResultOrder("ipv4first");

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSchemaVersion?: string;
};

const PRISMA_SCHEMA_VERSION = "staff-profiles-v1";

const DATABASE_URL = getDatabaseUrl();

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: DATABASE_URL,
    // Increase timeouts and pool size to be more resilient to transient
    // network blips and slower cloud DB responses.
    connectionTimeoutMillis: 30_000,
    idleTimeoutMillis: 60_000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 30_000,
    max: 10,
    // Allow longer-running queries for heavier lookups
    query_timeout: 60_000,
  });

  const logs: Array<"query" | "info" | "warn" | "error"> =
    process.env.NODE_ENV === "production"
      ? ["warn", "error"]
      : ["query", "info", "warn", "error"];

  return new PrismaClient({ adapter, log: logs as any });
}

export const prisma =
  globalForPrisma.prismaSchemaVersion === PRISMA_SCHEMA_VERSION &&
  globalForPrisma.prisma
    ? globalForPrisma.prisma
    : createPrismaClient();

// Add simple timing middleware and query event listener in non-production
if (process.env.NODE_ENV !== "production") {
  try {
    prisma.$use(async (params, next) => {
      const start = Date.now();
      const result = await next(params);
      const ms = Date.now() - start;
      if (ms > 50) {
        // eslint-disable-next-line no-console
        console.warn(`prisma: ${params.model}.${params.action} took ${ms}ms`);
      }
      return result;
    });

    prisma.$on("query", (e: any) => {
      // eslint-disable-next-line no-console
      console.debug(`prisma query (${e.duration}ms): ${e.query}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("Failed to attach prisma middleware/listener:", err);
  }
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
}
