import "server-only";
import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { hashOpaqueToken } from "@/lib/crypto/tokens";
import { accountLoginUrl } from "@/lib/notifications/account-login-url";

/** Called in the account creation transaction; only the hash is persisted. */
export async function createAccountSetupUrl(db: Pick<Prisma.TransactionClient, "passwordResetToken">, userId: string, email?: string | null) {
  const token = randomBytes(32).toString("hex");
  await db.passwordResetToken.create({ data: {
    userId, email: email ?? "", token: hashOpaqueToken(token, "password-reset"),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  } });
  const url = new URL("/reset-password", accountLoginUrl());
  url.searchParams.set("token", token);
  return url.toString();
}
