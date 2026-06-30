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

function readPositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function createPrismaClient() {
  const poolMax = readPositiveInt(process.env.PRISMA_POOL_MAX, 10);
  const connectionTimeoutMillis = readPositiveInt(
    process.env.PRISMA_CONNECTION_TIMEOUT_MS,
    30_000,
  );
  const idleTimeoutMillis = readPositiveInt(
    process.env.PRISMA_IDLE_TIMEOUT_MS,
    60_000,
  );
  const queryTimeout = readPositiveInt(process.env.PRISMA_QUERY_TIMEOUT_MS, 60_000);

  const adapter = new PrismaPg({
    connectionString: DATABASE_URL,
    // Increase timeouts and pool size to be more resilient to transient
    // network blips and slower cloud DB responses.
    connectionTimeoutMillis,
    idleTimeoutMillis,
    keepAlive: true,
    keepAliveInitialDelayMillis: 30_000,
    max: poolMax,
    // Allow longer-running queries for heavier lookups
    query_timeout: queryTimeout,
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
        console.debug(`prisma query (${ev.duration ?? "?"}ms): ${ev.query}`);
      },
    );
  } catch (err) {
    console.warn("Failed to attach prisma query listener:", err);
  }
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
}
