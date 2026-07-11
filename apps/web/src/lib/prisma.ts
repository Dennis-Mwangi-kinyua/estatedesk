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

/** Bump when schema/client changes so the dev global cache is recreated. */
const PRISMA_SCHEMA_VERSION = "stability-pool-v2-admins";

const DATABASE_URL = getDatabaseUrl();

function readPositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function hasAccountingRequestDelegate(client: PrismaClient) {
  return typeof client.accountingRequest?.findMany === "function";
}

function createPrismaClient() {
  // Neon free/pooler is sensitive to large pools. Keep defaults conservative,
  // but allow enough headroom for cold starts (first query often needs SSL + TCP).
  const poolMax = readPositiveInt(process.env.PRISMA_POOL_MAX, 5);
  const connectionTimeoutMillis = readPositiveInt(
    process.env.PRISMA_CONNECTION_TIMEOUT_MS,
    45_000,
  );
  const idleTimeoutMillis = readPositiveInt(
    process.env.PRISMA_IDLE_TIMEOUT_MS,
    20_000,
  );
  const queryTimeout = readPositiveInt(process.env.PRISMA_QUERY_TIMEOUT_MS, 45_000);

  const adapter = new PrismaPg({
    connectionString: DATABASE_URL,
    connectionTimeoutMillis,
    idleTimeoutMillis,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
    max: poolMax,
    query_timeout: queryTimeout,
  });

  const client = new PrismaClient({ adapter, log: [] });

  if (!hasAccountingRequestDelegate(client)) {
    throw new Error(
      "Prisma client is missing AccountingRequest delegates. Run `npx prisma generate` and restart the dev server.",
    );
  }

  return client;
}

function getPrismaClient() {
  const cached = globalForPrisma.prisma;

  if (
    cached &&
    globalForPrisma.prismaSchemaVersion === PRISMA_SCHEMA_VERSION &&
    hasAccountingRequestDelegate(cached)
  ) {
    return cached;
  }

  const client = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
  }

  return client;
}

export const prisma = getPrismaClient();