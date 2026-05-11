import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

export async function GET(request: Request) {
  const token = getBearerToken(request);

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
      org: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
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
      rentAmount: true,
      type: true,
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
    organization: {
      id: apiKey.org.id,
      name: apiKey.org.name,
      slug: apiKey.org.slug,
    },
    count: units.length,
    houses: units.map((unit) => ({
      id: unit.id,
      houseNumber: unit.houseNo,
      bedrooms: unit.bedrooms,
      location:
        unit.property.location ??
        unit.property.address ??
        unit.property.name,
      property: unit.property.name,
      building: unit.building?.name ?? null,
      type: unit.type,
      price: Number(unit.rentAmount),
      currency: "KES",
    })),
  });
}
