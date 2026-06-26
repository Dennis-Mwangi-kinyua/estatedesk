import "dotenv/config";
import dns from "node:dns";
import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getDatabaseUrl } from "@/lib/config/env";

dns.setDefaultResultOrder("ipv4first");

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSchemaVersion?: string;
};

const PRISMA_SCHEMA_VERSION = "cron-job-runs-v1";

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

  const logs: Prisma.LogLevel[] =
    process.env.NODE_ENV === "production"
      ? ["warn", "error"]
      : ["query", "info", "warn", "error"];

  return new PrismaClient({ adapter, log: logs });
}

export const prisma =
  globalForPrisma.prismaSchemaVersion === PRISMA_SCHEMA_VERSION &&
  globalForPrisma.prisma
    ? globalForPrisma.prisma
    : createPrismaClient();

// Add query event listener in non-production to surface slow queries.
if (process.env.NODE_ENV !== "production") {
  try {
    // Prisma client's $on typings may vary across environments. Use a
    // narrow unknown cast to avoid widening to `any` while still
    // allowing us to inspect query events in dev mode.
    (prisma as unknown as { $on: (event: string, cb: (arg: unknown) => void) => void }).$on(
      "query",
      (e: unknown) => {
        const ev = e as { duration?: number; query?: string };
        // eslint-disable-next-line no-console
        console.debug(`prisma query (${ev.duration ?? "?"}ms): ${ev.query}`);
      },
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("Failed to attach prisma query listener:", err);
  }
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
}
