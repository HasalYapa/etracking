// Script to update user credentials
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc'; // Use the service_role key

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// User credentials to update
const users = [
  {
    email: 'admin@etracking.store',
    password: 'Yapa@2001',
    role: 'admin',
    name: 'Admin User'
  },
  {
    email: 'dimanthayapa2001@gmail.com',
    password: 'Yapa@2006',
    role: 'driver',
    name: 'Dimantha Yapa'
  },
  {
    email: 'sampathyt1973@gmail.com',
    password: 'Yapa@234',
    role: 'shop_owner',
    name: 'Sampath'
  }
];

async function updateUserCredentials() {
  try {
    console.log('Updating user credentials...');
    
    // List all users
    const { data: allUsers, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error listing users:', usersError.message);
      return;
    }
    
    console.log(`Found ${allUsers.users.length} users in the system`);
    
    // Update each user
    for (const userToUpdate of users) {
      console.log(`\nProcessing user: ${userToUpdate.email}`);
      
      // Find the user
      const existingUser = allUsers.users.find(u => u.email === userToUpdate.email);
      
      if (existingUser) {
        console.log('User found:', existingUser.id);
        
        // Update user password
        console.log('Updating password...');
        const { error: passwordError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          { password: userToUpdate.password }
        );
        
        if (passwordError) {
          console.error('Error updating password:', passwordError.message);
        } else {
          console.log('Password updated successfully');
        }
        
        // Update user metadata
        console.log('Updating user metadata...');
        const { error: metadataError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          {
            user_metadata: {
              name: userToUpdate.name,
              role: userToUpdate.role
            }
          }
        );
        
        if (metadataError) {
          console.error('Error updating metadata:', metadataError.message);
        } else {
          console.log('Metadata updated successfully');
        }
        
        // Check if the user has a profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', existingUser.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching profile:', profileError.message);
          
          // Create profile if it doesn't exist
          console.log('Creating profile...');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: existingUser.id,
              name: userToUpdate.name,
              email: userToUpdate.email,
              role: userToUpdate.role,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          if (insertError) {
            console.error('Error creating profile:', insertError.message);
          } else {
            console.log('Profile created successfully');
          }
        } else {
          console.log('Profile exists:', profile);
          
          // Update profile
          console.log('Updating profile...');
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              name: userToUpdate.name,
              role: userToUpdate.role,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingUser.id);
          
          if (updateError) {
            console.error('Error updating profile:', updateError.message);
          } else {
            console.log('Profile updated successfully');
          }
        }
      } else {
        console.log('User not found, creating new user...');
        
        // Create new user
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: userToUpdate.email,
          password: userToUpdate.password,
          email_confirm: true,
          user_metadata: {
            name: userToUpdate.name,
            role: userToUpdate.role
          }
        });
        
        if (createError) {
          console.error('Error creating user:', createError.message);
        } else {
          console.log('User created successfully:', newUser);
          
          // Create profile for new user
          console.log('Creating profile for new user...');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: newUser.user.id,
              name: userToUpdate.name,
              email: userToUpdate.email,
              role: userToUpdate.role,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          if (insertError) {
            console.error('Error creating profile:', insertError.message);
          } else {
            console.log('Profile created successfully');
          }
        }
      }
    }
    
    console.log('\nUser credentials update completed');
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

updateUserCredentials();
