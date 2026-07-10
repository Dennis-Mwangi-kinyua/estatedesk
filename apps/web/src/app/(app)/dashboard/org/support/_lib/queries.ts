import "server-only";

import { prisma } from "@/lib/prisma";
import type { SupportPageData } from "./types";

export async function getSupportPageData(orgId: string): Promise<SupportPageData> {
  const [messages, organization, totalMessages, openMessages, readMessages] =
    await Promise.all([
    prisma.platformMessage.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        subject: true,
        message: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true },
    }),
    prisma.platformMessage.count({
      where: { orgId },
    }),
    prisma.platformMessage.count({
      where: { orgId, status: "OPEN" },
    }),
    prisma.platformMessage.count({
      where: { orgId, status: "READ" },
    }),
  ]);

  return {
    organizationName: organization?.name ?? "Organisation",
    messages,
    stats: {
      totalMessages,
      openMessages,
      readMessages,
    },
  };
}