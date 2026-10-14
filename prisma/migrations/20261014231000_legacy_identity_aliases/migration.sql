CREATE OR REPLACE FUNCTION enforce_registered_identity() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  normalized text;
  owner_key text;
  account_id text;
  claim_owner text;
  prior_owner_key text;
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
  -- Linking a legacy tenant row to its durable identity must not claim a second person.
  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'Tenant' AND account_id IS NULL THEN
    IF OLD."userId" IS NULL AND regexp_replace(upper(OLD."nationalId"), '[[:space:]-]', '', 'g') = normalized THEN
      prior_owner_key := COALESCE('identity:' || OLD."identityId", 'tenant:' || OLD.id);
    END IF;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(normalized, 0));
  IF EXISTS (SELECT 1 FROM "RegisteredIdentityOwners" WHERE number = normalized AND "ownerKey" <> owner_key AND (prior_owner_key IS NULL OR "ownerKey" <> prior_owner_key)) THEN
    RAISE EXCEPTION 'ID_ALREADY_REGISTERED: Platform identity verification is required.';
  END IF;
  SELECT "ownerKey" INTO claim_owner FROM "IdentityClaim" WHERE number = normalized FOR UPDATE;
  IF prior_owner_key IS NOT NULL AND claim_owner = prior_owner_key THEN
    UPDATE "IdentityClaim" SET "ownerKey" = owner_key, "userId" = account_id WHERE number = normalized;
    claim_owner := owner_key;
  END IF;
  IF claim_owner IS NOT NULL AND claim_owner <> owner_key THEN
    RAISE EXCEPTION 'ID_ALREADY_REGISTERED: Platform identity verification is required.';
  END IF;
  INSERT INTO "IdentityClaim" (number, "ownerKey", "userId") VALUES (normalized, owner_key, account_id) ON CONFLICT (number) DO NOTHING;
  NEW."nationalId" := normalized;
  RETURN NEW;
END;
$$;
