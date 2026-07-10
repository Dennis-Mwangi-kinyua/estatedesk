import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getPlatformControl } from "@/lib/platform/control";

export const dynamic = "force-dynamic";

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function getBearerToken(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const [scheme, token] = auth.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
}

function hasVacantListingsPermission(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const permissions = value as Record<string, unknown>;
  const publicListings = permissions.publicListings;

  return (
    Array.isArray(publicListings) &&
    publicListings.includes("vacant_units:read")
  );
}

async function enforceRateLimit(request: Request, token: string | null) {
  const keyPart = token
    ? createHash("sha256").update(token).digest("hex").slice(0, 16)
    : getClientIp(request);
  const result = await checkRateLimit({
    key: `public-vacant-houses:${keyPart}`,
    limit: 60,
    windowMs: 60_000,
  });

  if (result.allowed) return null;

  return NextResponse.json(
    {
      error: `Too many requests. Please retry in ${result.retryAfterSeconds} seconds.`,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
      },
    },
  );
}

export async function GET(request: Request) {
  const control = await getPlatformControl();
  if (control.publicApiDisabled || control.maintenanceMode) {
    return NextResponse.json(
      {
        error: control.maintenanceMode
          ? "EstateDesk is in maintenance mode."
          : "Public API is temporarily disabled by platform control.",
      },
      { status: 503 },
    );
  }

  const token = getBearerToken(request);
  const rateLimitResponse = await enforceRateLimit(request, token);

  if (rateLimitResponse) return rateLimitResponse;

  if (!token) {
    return NextResponse.json({ error: "Missing bearer token." }, { status: 401 });
  }

  const keyHash = createHash("sha256").update(token).digest("hex");
  const apiKey = await prisma.apiKey.findFirst({
    where: {
      keyHash,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: {
      id: true,
      orgId: true,
      permissions: true,
    },
  });

  if (!apiKey || !hasVacantListingsPermission(apiKey.permissions)) {
    return NextResponse.json({ error: "Invalid API key." }, { status: 401 });
  }

  const units = await prisma.unit.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      status: "VACANT",
      property: {
        orgId: apiKey.orgId,
        deletedAt: null,
        isActive: true,
      },
    },
    orderBy: [{ property: { name: "asc" } }, { houseNo: "asc" }],
    take: 200,
    select: {
      id: true,
      houseNo: true,
      bedrooms: true,
      bathrooms: true,
      roomCount: true,
      rentAmount: true,
      serviceCharge: true,
      garbageFee: true,
      securityFee: true,
      electricityBilling: true,
      hasBalcony: true,
      viewingFeeRequired: true,
      viewingFeeAmount: true,
      type: true,
      images: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        take: 4,
        select: {
          key: true,
          fileName: true,
        },
      },
      property: {
        select: {
          name: true,
          location: true,
          address: true,
        },
      },
      building: {
        select: {
          name: true,
        },
      },
    },
  });

  void prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch((error) => {
      console.error("Failed to update API key lastUsedAt", error);
    });

  return NextResponse.json({
    count: units.length,
    houses: units.map((unit) => ({
      id: unit.id,
      houseNumber: unit.houseNo,
      bedrooms: unit.bedrooms,
      bathrooms: unit.bathrooms,
      roomCount: unit.roomCount,
      location:
        unit.property.location ??
        unit.property.address ??
        unit.property.name,
      property: unit.property.name,
      building: unit.building?.name ?? null,
      type: unit.type,
      price: Number(unit.rentAmount),
      serviceCharge: unit.serviceCharge ? Number(unit.serviceCharge) : null,
      garbageFee: unit.garbageFee ? Number(unit.garbageFee) : null,
      securityFee: unit.securityFee ? Number(unit.securityFee) : null,
      electricityBilling: unit.electricityBilling,
      hasBalcony: unit.hasBalcony,
      viewingFeeRequired: unit.viewingFeeRequired,
      viewingFeeAmount: unit.viewingFeeAmount ? Number(unit.viewingFeeAmount) : null,
      images: unit.images.map((image) => ({
        url: image.key,
        fileName: image.fileName,
      })),
      currency: "KES",
    })),
  });
}
