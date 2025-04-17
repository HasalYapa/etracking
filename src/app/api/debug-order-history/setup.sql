-- Create a function to get table information
CREATE OR REPLACE FUNCTION debug_table_info(table_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Get column information
  WITH columns AS (
    SELECT 
      column_name, 
      data_type, 
      is_nullable,
      column_default
    FROM 
      information_schema.columns
    WHERE 
      table_name = debug_table_info.table_name
  ),
  -- Get constraint information
  constraints AS (
    SELECT 
      tc.constraint_name,
      tc.constraint_type,
      kcu.column_name
    FROM 
      information_schema.table_constraints tc
    JOIN 
      information_schema.key_column_usage kcu
    ON 
      tc.constraint_name = kcu.constraint_name
    WHERE 
      tc.table_name = debug_table_info.table_name
  )
  -- Combine the information
  SELECT 
    jsonb_build_object(
      'columns', jsonb_agg(c),
      'constraints', jsonb_agg(DISTINCT con)
    ) INTO result
  FROM 
    columns c
  LEFT JOIN 
    constraints con
  ON 
    c.column_name = con.column_name;
    
  RETURN result;
END;
$$;

-- Create a function to get trigger information
CREATE OR REPLACE FUNCTION debug_triggers_info(table_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Get trigger information
  WITH triggers AS (
    SELECT 
      trigger_name,
      event_manipulation,
      action_statement,
      action_timing
    FROM 
      information_schema.triggers
    WHERE 
      event_object_table = debug_triggers_info.table_name
  )
  -- Return the information
  SELECT 
    jsonb_agg(t) INTO result
  FROM 
    triggers t;
    
  RETURN result;
END;
$$;
