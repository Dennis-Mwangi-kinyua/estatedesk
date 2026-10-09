import "server-only";

import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

function slugBase(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "user";
}

/** Persist a readable, unique database slug for legacy users that predate slugs. */
export async function ensureUserSlug(user: {
  id: string;
  fullName: string;
  slug: string | null;
}) {
  if (user.slug?.trim()) return user.slug.trim();

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const slug = `${slugBase(user.fullName)}-${randomBytes(3).toString("hex")}`;
    try {
      await prisma.user.updateMany({
        where: { id: user.id, slug: null },
        data: { slug },
      });
      const updated = await prisma.user.findUnique({
        where: { id: user.id },
        select: { slug: true },
      });
      if (updated?.slug) return updated.slug;
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Could not assign a unique user slug.");
}
