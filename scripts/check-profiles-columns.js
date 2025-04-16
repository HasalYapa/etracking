// Script to check the exact structure of the profiles table
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc'; // Use the service_role key

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfilesColumns() {
  try {
    console.log('Checking the structure of the profiles table...');
    
    // Get a sample profile to see the structure
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error accessing profiles table:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Sample profile:');
      console.log(data[0]);
      
      // Get the column names
      const columns = Object.keys(data[0]);
      console.log('\nColumns in the profiles table:');
      columns.forEach(column => {
        console.log(`- ${column}`);
      });
    } else {
      console.log('No profiles found in the table.');
    }
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

checkProfilesColumns();
