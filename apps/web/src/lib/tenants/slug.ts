import type { PrismaClient } from "@prisma/client";

type TenantDb = Pick<PrismaClient, "tenant">;

export function slugifyTenantName(fullName: string) {
  const base = fullName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 48);

  return base || "tenant";
}

/**
 * Allocate a unique slug within an organization.
 * Prefers `jane-doe`, then `jane-doe-2`, …
 */
export async function allocateTenantSlug(
  db: TenantDb,
  orgId: string,
  fullName: string,
  excludeTenantId?: string,
) {
  const base = slugifyTenantName(fullName);

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base.slice(0, 40)}-${attempt + 1}`;

    const existing = await db.tenant.findFirst({
      where: {
        orgId,
        slug: candidate,
        ...(excludeTenantId ? { id: { not: excludeTenantId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) return candidate;
  }

  // Extremely unlikely fallback
  return `${base.slice(0, 32)}-${Date.now().toString(36)}`;
}

/** Ensure a tenant has a slug; returns the canonical slug. */
export async function ensureTenantSlug(
  db: TenantDb,
  tenant: { id: string; orgId: string; fullName: string; slug?: string | null },
) {
  if (tenant.slug?.trim()) return tenant.slug.trim();

  const slug = await allocateTenantSlug(db, tenant.orgId, tenant.fullName, tenant.id);
  await db.tenant.update({
    where: { id: tenant.id },
    data: { slug },
    select: { id: true },
  });
  return slug;
}
