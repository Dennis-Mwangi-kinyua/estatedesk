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

const PRISMA_SCHEMA_VERSION = "cron-job-runs-no-db-logs-v1";

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

  // Database diagnostics must never be forwarded to application output or
  // the browser development console. Errors still propagate to the caller
  // and are handled by the existing application error boundaries.
  return new PrismaClient({ adapter, log: [] });
}

export const prisma =
  globalForPrisma.prismaSchemaVersion === PRISMA_SCHEMA_VERSION &&
  globalForPrisma.prisma
    ? globalForPrisma.prisma
    : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
}
