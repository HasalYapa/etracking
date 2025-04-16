const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc'; // Use the service_role key here

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  try {
    console.log('Checking tables...');

    // Check profiles table
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.error('Error querying profiles table:', profilesError.message);
    } else {
      console.log('Profiles table exists and can be queried.');
      if (profilesData.length > 0) {
        console.log('Sample profile:', profilesData[0]);
      } else {
        console.log('No profiles found in the table.');
      }
    }

    // Check admin user
    const { data: adminData, error: adminError } = await supabase.auth.admin.listUsers();

    if (adminError) {
      console.error('Error listing users:', adminError.message);
      return;
    }

    const adminUser = adminData.users.find(user => user.email === 'admin@etracking.store');

    if (adminUser) {
      console.log('Admin user found:', adminUser.id);

      // Try to get the admin profile directly
      const { data: adminProfile, error: adminProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', adminUser.id)
        .single();

      if (adminProfileError) {
        console.error('Error getting admin profile:', adminProfileError.message);
      } else {
        console.log('Admin profile found:', adminProfile);
      }
    } else {
      console.log('Admin user not found');
    }

  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

checkTables();
