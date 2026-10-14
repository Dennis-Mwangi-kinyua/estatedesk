-- CreateEnum
CREATE TYPE "IdentityVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'USED');

-- DropIndex
DROP INDEX "Tenant_userId_key";

-- AlterTable
ALTER TABLE "ServiceProvider" ADD COLUMN     "nationalId" TEXT;

-- CreateTable
CREATE TABLE "IdentityClaim" (
    "number" TEXT NOT NULL,
    "ownerKey" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdentityClaim_pkey" PRIMARY KEY ("number")
);

-- CreateTable
CREATE TABLE "IdentityVerificationRequest" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "requestedRole" "OrgRole" NOT NULL,
    "reason" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "status" "IdentityVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedUserId" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdentityVerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IdentityClaim_userId_idx" ON "IdentityClaim"("userId");

-- CreateIndex
CREATE INDEX "IdentityVerificationRequest_orgId_status_idx" ON "IdentityVerificationRequest"("orgId", "status");

-- CreateIndex
CREATE INDEX "IdentityVerificationRequest_status_createdAt_idx" ON "IdentityVerificationRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "IdentityVerificationRequest_number_idx" ON "IdentityVerificationRequest"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_orgId_userId_key" ON "Tenant"("orgId", "userId");

-- AddForeignKey
ALTER TABLE "IdentityClaim" ADD CONSTRAINT "IdentityClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityVerificationRequest" ADD CONSTRAINT "IdentityVerificationRequest_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A single normalised ID belongs to one person, across all registration tables.
-- Legacy ambiguous IDs are left untouched and blocked pending operator correction.
CREATE VIEW "RegisteredIdentityOwners" AS
SELECT regexp_replace(upper(t."nationalId"), '[[:space:]-]', '', 'g') AS number,
       COALESCE('user:' || t."userId", 'identity:' || t."identityId", 'tenant:' || t.id) AS "ownerKey", t."userId"
FROM "Tenant" t WHERE NULLIF(trim(t."nationalId"), '') IS NOT NULL
UNION ALL
SELECT regexp_replace(upper(s."nationalId"), '[[:space:]-]', '', 'g'), 'user:' || m."userId", m."userId"
FROM "StaffProfile" s JOIN "Membership" m ON m.id = s."membershipId" WHERE NULLIF(trim(s."nationalId"), '') IS NOT NULL
UNION ALL
SELECT regexp_replace(upper(l."nationalId"), '[[:space:]-]', '', 'g'), 'user:' || l."userId", l."userId"
FROM "LandlordProfile" l WHERE NULLIF(trim(l."nationalId"), '') IS NOT NULL
UNION ALL
SELECT regexp_replace(upper(p."nationalId"), '[[:space:]-]', '', 'g'), 'user:' || p."userId", p."userId"
FROM "ServiceProvider" p WHERE NULLIF(trim(p."nationalId"), '') IS NOT NULL;

INSERT INTO "IdentityClaim" (number, "ownerKey", "userId")
SELECT number, min("ownerKey"), min("userId") FROM "RegisteredIdentityOwners"
WHERE number <> '' GROUP BY number HAVING count(DISTINCT "ownerKey") = 1;

CREATE FUNCTION enforce_registered_identity() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  normalized text;
  owner_key text;
  account_id text;
  claim_owner text;
BEGIN
  normalized := regexp_replace(upper(NEW."nationalId"), '[[:space:]-]', '', 'g');
  IF normalized IS NULL OR normalized = '' THEN
    NEW."nationalId" := NULL;
    RETURN NEW;
  END IF;
  IF normalized !~ '^[A-Z0-9]{5,30}$' THEN
    RAISE EXCEPTION 'INVALID_ID_NUMBER: Enter 5 to 30 letters or digits.';
  END IF;
  IF TG_TABLE_NAME = 'StaffProfile' THEN
    SELECT "userId" INTO account_id FROM "Membership" WHERE id = NEW."membershipId";
    owner_key := 'user:' || account_id;
  ELSE
    account_id := NEW."userId";
    owner_key := 'user:' || account_id;
    IF account_id IS NULL AND TG_TABLE_NAME = 'Tenant' THEN
      owner_key := COALESCE('identity:' || NEW."identityId", 'tenant:' || NEW.id);
    END IF;
  END IF;
  IF owner_key IS NULL THEN RAISE EXCEPTION 'ID_ACCOUNT_REQUIRED: Link an account before registering an ID.'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(normalized, 0));
  IF EXISTS (SELECT 1 FROM "RegisteredIdentityOwners" WHERE number = normalized AND "ownerKey" <> owner_key) THEN
    RAISE EXCEPTION 'ID_ALREADY_REGISTERED: Platform identity verification is required.';
  END IF;
  SELECT "ownerKey" INTO claim_owner FROM "IdentityClaim" WHERE number = normalized FOR UPDATE;
  IF claim_owner IS NOT NULL AND claim_owner <> owner_key THEN
    RAISE EXCEPTION 'ID_ALREADY_REGISTERED: Platform identity verification is required.';
  END IF;
  INSERT INTO "IdentityClaim" (number, "ownerKey", "userId") VALUES (normalized, owner_key, account_id) ON CONFLICT (number) DO NOTHING;
  NEW."nationalId" := normalized;
  RETURN NEW;
END;
$$;
CREATE TRIGGER tenant_registered_identity BEFORE INSERT OR UPDATE OF "nationalId", "userId", "identityId" ON "Tenant" FOR EACH ROW EXECUTE FUNCTION enforce_registered_identity();
CREATE TRIGGER staff_registered_identity BEFORE INSERT OR UPDATE OF "nationalId", "membershipId" ON "StaffProfile" FOR EACH ROW EXECUTE FUNCTION enforce_registered_identity();
CREATE TRIGGER landlord_registered_identity BEFORE INSERT OR UPDATE OF "nationalId", "userId" ON "LandlordProfile" FOR EACH ROW EXECUTE FUNCTION enforce_registered_identity();
CREATE TRIGGER provider_registered_identity BEFORE INSERT OR UPDATE OF "nationalId", "userId" ON "ServiceProvider" FOR EACH ROW EXECUTE FUNCTION enforce_registered_identity();
