import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type AppSessionUser = {
  id: string;
  email: string | null;
  fullName: string;
  orgId?: string | null;
};

export const getCurrentUser = cache(async (): Promise<AppSessionUser | null> => {
  /**
   * Replace this with your real auth integration:
   * - Clerk
   * - NextAuth/Auth.js
   * - Better Auth
   * - custom JWT/cookie session
   */

  const mockUserId = process.env.DEV_USER_ID;

  if (!mockUserId) return null;

  const user = await prisma.user.findUnique({
    where: { id: mockUserId },
    select: {
      id: true,
      email: true,
      fullName: true,
      memberships: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: {
          orgId: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    orgId: user.memberships[0]?.orgId ?? null,
  };
});

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}