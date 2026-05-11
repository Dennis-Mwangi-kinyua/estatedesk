import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSchemaVersion?: string;
};

const PRISMA_SCHEMA_VERSION = "pg-adapter-onboarding-requests";
const fallbackDatasourceUrl = "postgresql://user:password@localhost:5432/estatedesk";
const DATABASE_URL =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? fallbackDatasourceUrl;

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: DATABASE_URL,
    connectionTimeoutMillis: 10_000,
  });

  return new PrismaClient({ adapter });
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
