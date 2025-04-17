-- First drop the policy if it exists to avoid errors
DROP POLICY IF EXISTS "drivers_can_create_any_order_history" ON "order_history";

-- Create the policy
CREATE POLICY "drivers_can_create_any_order_history" 
ON "order_history" 
FOR INSERT TO authenticated 
USING (true) 
WITH CHECK (true);

-- Verify the policy was created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM 
  pg_policies 
WHERE 
  tablename = 'order_history' AND
  policyname = 'drivers_can_create_any_order_history';
