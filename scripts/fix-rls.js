const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc'; // Use the service_role key here

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLS() {
  try {
    console.log('Fixing RLS policies...');
    
    // Create RLS policies for profiles table
    const { error: policyError } = await supabase.rpc('execute_sql', {
      sql: `
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
        DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
        DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
        
        -- Create policies
        CREATE POLICY "Users can view their own profile"
          ON profiles FOR SELECT
          USING (auth.uid() = id);
        
        CREATE POLICY "Users can update their own profile"
          ON profiles FOR UPDATE
          USING (auth.uid() = id);
        
        CREATE POLICY "Admin can view all profiles"
          ON profiles FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM profiles
              WHERE id = auth.uid() AND role = 'admin'
            )
          );
          
        -- Make sure RLS is enabled
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (policyError) {
      console.error('Error creating policies:', policyError.message);
      return;
    }
    
    console.log('RLS policies created successfully!');
    
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

fixRLS();
