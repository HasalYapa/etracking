const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc'; // Use the service_role key here

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
  try {
    console.log('Checking RLS policies...');
    
    // Execute a raw SQL query to get RLS policies
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'profiles' });
    
    if (policiesError) {
      console.error('Error getting policies:', policiesError.message);
      
      // Try a different approach
      const { data, error } = await supabase.from('pg_policies').select('*');
      
      if (error) {
        console.error('Error getting policies (alternative):', error.message);
      } else {
        console.log('Policies (alternative):', data);
      }
      
      return;
    }
    
    console.log('RLS Policies for profiles table:', policies);
    
    // Check if RLS is enabled for the profiles table
    const { data: rlsEnabled, error: rlsError } = await supabase
      .rpc('check_rls_enabled', { table_name: 'profiles' });
    
    if (rlsError) {
      console.error('Error checking RLS status:', rlsError.message);
    } else {
      console.log('RLS enabled for profiles table:', rlsEnabled);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

checkRLS();
