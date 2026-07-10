-- AlterTable (idempotent: column may already exist from earlier manual apply)
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- Backfill unique org-scoped slugs from full name + short id suffix when needed.
WITH ranked AS (
  SELECT
    t."id",
    t."orgId",
    lower(
      regexp_replace(
        regexp_replace(
          trim(both from coalesce(nullif(trim(t."fullName"), ''), 'tenant')),
          '[^a-zA-Z0-9]+',
          '-',
          'g'
        ),
        '(^-+|-+$)',
        '',
        'g'
      )
    ) AS base_slug
  FROM "Tenant" t
),
prepared AS (
  SELECT
    r."id",
    r."orgId",
    CASE
      WHEN r.base_slug IS NULL OR r.base_slug = '' THEN 'tenant'
      ELSE left(r.base_slug, 48)
    END AS base_slug,
    row_number() OVER (
      PARTITION BY r."orgId",
        CASE
          WHEN r.base_slug IS NULL OR r.base_slug = '' THEN 'tenant'
          ELSE left(r.base_slug, 48)
        END
      ORDER BY r."id"
    ) AS rn
  FROM ranked r
)
UPDATE "Tenant" t
SET "slug" = CASE
  WHEN p.rn = 1 THEN p.base_slug
  ELSE left(p.base_slug, 40) || '-' || p.rn::text
END
FROM prepared p
WHERE t."id" = p."id";

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_orgId_slug_key" ON "Tenant"("orgId", "slug");

-- CreateIndex
CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug");
