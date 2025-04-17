-- Function to get triggers for a table
CREATE OR REPLACE FUNCTION get_triggers_for_table(table_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  WITH triggers AS (
    SELECT 
      t.tgname AS trigger_name,
      t.tgenabled AS enabled,
      CASE t.tgtype & 1 WHEN 1 THEN 'ROW' ELSE 'STATEMENT' END AS trigger_level,
      CASE t.tgtype & 66 
        WHEN 2 THEN 'BEFORE' 
        WHEN 64 THEN 'INSTEAD OF' 
        ELSE 'AFTER' 
      END AS trigger_timing,
      CASE t.tgtype & 28
        WHEN 16 THEN 'UPDATE'
        WHEN 8 THEN 'DELETE'
        WHEN 4 THEN 'INSERT'
        WHEN 20 THEN 'INSERT OR UPDATE'
        WHEN 28 THEN 'INSERT OR UPDATE OR DELETE'
        WHEN 24 THEN 'UPDATE OR DELETE'
        WHEN 12 THEN 'INSERT OR DELETE'
      END AS trigger_event,
      p.proname AS trigger_function
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_proc p ON t.tgfoid = p.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relname = table_name
    AND n.nspname = 'public'
  )
  SELECT jsonb_agg(t) INTO result
  FROM triggers t;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Function to get the definition of a function
CREATE OR REPLACE FUNCTION get_function_definition(function_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  func_def text;
BEGIN
  SELECT pg_get_functiondef(p.oid)
  INTO func_def
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE p.proname = function_name
  AND n.nspname = 'public';
  
  RETURN func_def;
END;
$$;
