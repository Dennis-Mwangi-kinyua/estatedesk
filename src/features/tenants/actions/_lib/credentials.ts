import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";

export function slugifyUsernameBase(fullName: string) {
  const normalized = fullName
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 18);

  return normalized || "tenant";
}

export function generatePassword(length = 10) {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(length);
  let password = "";

  for (let index = 0; index < length; index += 1) {
    password += alphabet[bytes[index] % alphabet.length];
  }

  return password;
}

export async function generateUniqueUsername(
  tx: Prisma.TransactionClient,
  fullName: string,
) {
  const base = slugifyUsernameBase(fullName);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix =
      attempt === 0 ? "" : `${Math.floor(1000 + Math.random() * 9000)}`;
    const candidate = `${base}${suffix}`;

    const existing = await tx.user.findFirst({
      where: {
        username: candidate,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return candidate;
    }
  }

  return `${base}${Date.now().toString().slice(-6)}`;
}