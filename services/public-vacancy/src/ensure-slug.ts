import "server-only";

import { prisma } from "@/lib/prisma";
import { vacancyPublicSlug, vacancyPublicSlugForUnit } from "./slug";

type EnsureSlugInput = {
  id: string;
  houseNo: string;
  publicSlug?: string | null;
  property: { name: string };
};

/**
 * Ensures a unit has a unique `publicSlug`. Prefers the human base slug when free;
 * otherwise appends a short unit-id suffix to avoid collisions.
 */
export async function ensureUnitPublicSlug(unit: EnsureSlugInput): Promise<string> {
  if (unit.publicSlug?.trim()) {
    return unit.publicSlug.trim();
  }

  const base = vacancyPublicSlug({
    propertyName: unit.property.name,
    houseNo: unit.houseNo,
  });

  const collision = await prisma.unit.findFirst({
    where: {
      publicSlug: base,
      NOT: { id: unit.id },
    },
    select: { id: true },
  });

  const slug = collision
    ? vacancyPublicSlugForUnit({
        propertyName: unit.property.name,
        houseNo: unit.houseNo,
        unitId: unit.id,
        forceUnique: true,
      })
    : base;

  await prisma.unit.update({
    where: { id: unit.id },
    data: { publicSlug: slug },
  });

  return slug;
}
