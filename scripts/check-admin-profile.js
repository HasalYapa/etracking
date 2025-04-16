const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc'; // Use the service_role key here

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminProfile() {
  try {
    // Get the user ID for admin@etracking.store
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      console.error('Error listing users:', userError.message);
      return;
    }

    const adminUser = userData.users.find(user => user.email === 'admin@etracking.store');

    if (!adminUser) {
      console.error('Admin user not found');
      return;
    }

    console.log('Found admin user:', adminUser);

    // Check the profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminUser.id)
      .single();

    if (profileError) {
      console.error('Error checking profile:', profileError.message);
      return;
    }

    console.log('Admin profile:', profileData);

    // Update the profile if needed
    if (profileData.role !== 'admin') {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', adminUser.id);

      if (updateError) {
        console.error('Error updating profile:', updateError.message);
        return;
      }

      console.log('Admin role updated successfully!');
    } else {
      console.log('Admin role is already set correctly.');
    }
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

checkAdminProfile();
