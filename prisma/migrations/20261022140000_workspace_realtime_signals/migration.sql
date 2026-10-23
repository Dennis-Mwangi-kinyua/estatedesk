-- NOTIFY is delivered only on commit; identical scopes coalesce per transaction.
-- Never publish record contents, financial values, names or credentials.
CREATE OR REPLACE FUNCTION estatedesk_workspace_changed() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  previous_row jsonb;
  current_row jsonb;
  row_data jsonb;
  scope_id text;
BEGIN
  IF TG_OP <> 'INSERT' THEN previous_row := to_jsonb(OLD); END IF;
  IF TG_OP <> 'DELETE' THEN current_row := to_jsonb(NEW); END IF;
  IF TG_OP = 'UPDATE' AND (previous_row - 'lastSeenAt' - 'updatedAt') = (current_row - 'lastSeenAt' - 'updatedAt') THEN
    RETURN NULL;
  END IF;
  FOREACH row_data IN ARRAY ARRAY[previous_row, current_row] LOOP
    IF row_data IS NULL THEN CONTINUE; END IF;
    scope_id := row_data->>'orgId';
    IF TG_TABLE_NAME = 'Organization' THEN scope_id := row_data->>'id'; END IF;
    IF TG_TABLE_NAME IN ('JobApplication', 'ProviderJobPayment', 'ProviderReview') THEN
      SELECT "orgId" INTO scope_id FROM "ServiceJob" WHERE id = row_data->>'jobId';
    END IF;
    IF scope_id IS NOT NULL THEN
      PERFORM pg_notify('estatedesk_workspace', 'org:' || scope_id);
    END IF;
    scope_id := row_data->>'userId';
    IF TG_TABLE_NAME = 'User' THEN scope_id := row_data->>'id'; END IF;
    IF TG_TABLE_NAME IN ('JobApplication', 'ProviderReview') THEN
      SELECT "userId" INTO scope_id FROM "ServiceProvider" WHERE id = row_data->>'providerId';
    ELSIF TG_TABLE_NAME IN ('ServiceJob', 'ProviderJobPayment') THEN
      IF TG_TABLE_NAME = 'ServiceJob' THEN
        SELECT "userId" INTO scope_id FROM "ServiceProvider" WHERE id = row_data->>'providerId';
      ELSE
        SELECT provider."userId" INTO scope_id FROM "ServiceProvider" provider JOIN "ServiceJob" job ON job."providerId" = provider.id WHERE job.id = row_data->>'jobId';
      END IF;
    END IF;
    IF scope_id IS NOT NULL THEN
      PERFORM pg_notify('estatedesk_workspace', 'user:' || scope_id);
    END IF;
  END LOOP;
  IF TG_TABLE_NAME = 'ServiceJob' THEN PERFORM pg_notify('estatedesk_workspace', 'marketplace'); END IF;
  PERFORM pg_notify('estatedesk_workspace', 'platform');
  RETURN NULL;
END;
$$;

-- Exclude read-generated audit, heartbeat and transport rows to prevent loops.
-- Include domain tables carrying organization/user scope and organization/user
-- roots. New domain tables need the same trigger in their own migrations.
DO $$
DECLARE table_name text;
BEGIN
  FOR table_name IN
    SELECT DISTINCT columns.table_name FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND EXISTS (
        SELECT 1 FROM information_schema.tables AS base_table
        WHERE base_table.table_schema = columns.table_schema
          AND base_table.table_name = columns.table_name
          AND base_table.table_type = 'BASE TABLE'
      )
      AND (column_name IN ('orgId', 'userId') OR columns.table_name IN ('Organization', 'User', 'OnboardingRequest', 'PlatformControl', 'PlatformMessage', 'CronJobRun', 'JobApplication', 'ProviderJobPayment', 'ProviderReview'))
      AND columns.table_name NOT IN (
        'AuditLog', 'UserSession', 'RateLimitBucket', 'NativePushDelivery',
        'NativePushDevice', 'ReportExport', 'DataExportRequest'
      )
  LOOP
    EXECUTE format('CREATE TRIGGER estatedesk_workspace_change AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION estatedesk_workspace_changed()', table_name);
  END LOOP;
END;
$$;
