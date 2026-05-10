import "server-only";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { AppSession } from "@/lib/auth/session";

function firstHeader(headersList: Headers, names: string[]) {
  for (const name of names) {
    const value = headersList.get(name);
    if (value) return value;
  }

  return null;
}

function getIp(headersList: Headers) {
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;

  return firstHeader(headersList, [
    "x-real-ip",
    "cf-connecting-ip",
    "x-client-ip",
  ]);
}

export async function getRequestAuditMetadata() {
  const headerStore = await headers();
  const ip = getIp(headerStore);

  return {
    ip,
    userAgent: headerStore.get("user-agent"),
    requestId:
      firstHeader(headerStore, ["x-request-id", "x-vercel-id", "cf-ray"]) ??
      undefined,
    geo: {
      country: headerStore.get("x-vercel-ip-country"),
      region: headerStore.get("x-vercel-ip-country-region"),
      city: headerStore.get("x-vercel-ip-city"),
      latitude: headerStore.get("x-vercel-ip-latitude"),
      longitude: headerStore.get("x-vercel-ip-longitude"),
      serviceProvider:
        headerStore.get("x-vercel-ip-asn") ??
        headerStore.get("cf-ipcountry") ??
        null,
    },
  };
}

export async function auditDeniedAccess(input: {
  session: AppSession;
  reason: string;
  required?: string[];
  entityType?: string;
  entityId?: string;
}) {
  if (!input.session.activeOrgId) return;

  try {
    const request = await getRequestAuditMetadata();

    await prisma.auditLog.create({
      data: {
        orgId: input.session.activeOrgId,
        actorUserId: input.session.userId,
        action: "ACCESS_DENIED",
        entityType: input.entityType ?? "Route",
        entityId: input.entityId ?? "unknown",
        ip: request.ip,
        userAgent: request.userAgent,
        requestId: request.requestId,
        metadata: {
          reason: input.reason,
          required: input.required ?? [],
          activeOrgRole: input.session.activeOrgRole,
          platformRole: input.session.platformRole,
          geo: request.geo,
        },
      },
    });
  } catch (error) {
    console.error("Failed to write denied access audit log:", error);
  }
}
