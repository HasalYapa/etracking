// Script to create an admin user in Supabase
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc'; // Use the service_role key here

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
  try {
    // Create user using admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@etracking.store',
      password: 'Yapa@2001',
      email_confirm: true,
      user_metadata: {
        name: 'Admin User',
        role: 'admin'
      }
    });

    if (error) {
      console.error('Error creating user:', error.message);
      return;
    }

    console.log('Admin user created successfully:', data);

    // Manually insert into profiles table if the trigger doesn't work
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        name: 'Admin User',
        email: 'admin@etracking.store',
        role: 'admin'
      });

    if (profileError) {
      console.error('Error creating profile:', profileError.message);
      return;
    }

    console.log('Admin profile created successfully!');
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

// Run the function
createAdminUser();
