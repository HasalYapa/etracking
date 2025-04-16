const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iytimfpcrmabhrypdyem.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5dGltZnBjcm1hYmhyeXBkeWVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1MzQ5MywiZXhwIjoyMDYwMjI5NDkzfQ.y4GqiPmptM5ZPr38KfPsZkIgxiYUrj-1fiEzY5LJv14'; // Use the service_role key here

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateAdminRole() {
  try {
    // Get the user ID for admin@etracking.store
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', 'admin@etracking.store')
      .single();

    if (userError) {
      console.error('Error finding user:', userError.message);
      return;
    }

    if (!userData) {
      console.error('User not found');
      return;
    }

    console.log('Found user:', userData);

    // Check if profile exists
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking profile:', profileError.message);
      return;
    }

    if (profileData) {
      // Update existing profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: 'admin',
          name: 'Admin User'
        })
        .eq('id', userData.id);

      if (updateError) {
        console.error('Error updating profile:', updateError.message);
        return;
      }

      console.log('Admin profile updated successfully!');
    } else {
      // Create new profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userData.id,
          name: 'Admin User',
          email: 'admin@etracking.store',
          role: 'admin'
        });

      if (insertError) {
        console.error('Error creating profile:', insertError.message);
        return;
      }

      console.log('Admin profile created successfully!');
    }
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

updateAdminRole();
