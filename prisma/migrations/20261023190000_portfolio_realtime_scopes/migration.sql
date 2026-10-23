-- Portfolio children inherit organization scope through Property rather than
-- carrying orgId themselves. Publish identifiers only, after committed writes.
CREATE OR REPLACE FUNCTION estatedesk_portfolio_workspace_changed() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  previous_row jsonb;
  current_row jsonb;
  row_data jsonb;
  scope_id text;
BEGIN
  IF TG_OP <> 'INSERT' THEN previous_row := to_jsonb(OLD); END IF;
  IF TG_OP <> 'DELETE' THEN current_row := to_jsonb(NEW); END IF;
  IF TG_OP = 'UPDATE' AND (previous_row - 'updatedAt') = (current_row - 'updatedAt') THEN RETURN NULL; END IF;
  FOREACH row_data IN ARRAY ARRAY[previous_row, current_row] LOOP
    IF row_data IS NULL THEN CONTINUE; END IF;
    IF TG_TABLE_NAME = 'MeterReading' THEN
      SELECT property."orgId" INTO scope_id FROM "Property" property
      JOIN "Unit" unit ON unit."propertyId" = property.id WHERE unit.id = row_data->>'unitId';
    ELSE
      SELECT "orgId" INTO scope_id FROM "Property" WHERE id = row_data->>'propertyId';
    END IF;
    IF scope_id IS NOT NULL THEN PERFORM pg_notify('estatedesk_workspace', 'org:' || scope_id); END IF;
  END LOOP;
  PERFORM pg_notify('estatedesk_workspace', 'platform');
  RETURN NULL;
END;
$$;

CREATE TRIGGER estatedesk_portfolio_workspace_change
AFTER INSERT OR UPDATE OR DELETE ON "Unit"
FOR EACH ROW EXECUTE FUNCTION estatedesk_portfolio_workspace_changed();
CREATE TRIGGER estatedesk_portfolio_workspace_change
AFTER INSERT OR UPDATE OR DELETE ON "Building"
FOR EACH ROW EXECUTE FUNCTION estatedesk_portfolio_workspace_changed();
CREATE TRIGGER estatedesk_portfolio_workspace_change
AFTER INSERT OR UPDATE OR DELETE ON "MeterReading"
FOR EACH ROW EXECUTE FUNCTION estatedesk_portfolio_workspace_changed();
