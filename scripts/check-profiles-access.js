// Script to check if we can access the profiles table
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc'; // Use the service_role key

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfilesAccess() {
  try {
    console.log('Checking if we can access the profiles table...');
    
    // Try to select from the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('Error accessing profiles table:', error.message);
      console.log('Error details:', error);
      
      // The table might not exist, let's try to create it
      console.log('Attempting to create a test profile...');
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: '00000000-0000-0000-0000-000000000000', // Dummy ID
          name: 'Test User',
          email: 'test@example.com',
          role: 'test',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Error creating test profile:', insertError.message);
        console.log('Error details:', insertError);
      } else {
        console.log('Test profile created successfully.');
      }
    } else {
      console.log('Successfully accessed profiles table.');
      console.log('Profiles found:', data.length);
      console.log('Sample profiles:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

checkProfilesAccess();
