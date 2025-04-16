// Script to create an admin user in Supabase
import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const supabaseUrl = 'https://iytimfpcrmabhrypdyem.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5dGltZnBjcm1hYmhyeXBkeWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTM0OTMsImV4cCI6MjA2MDIyOTQ5M30.UgeeAwAZBefVO-TthK09cDQ68XsehWmlsiAGxlopXCU';

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminUser() {
  try {
    // Sign up the admin user
    const { data, error } = await supabase.auth.signUp({
      email: 'admin@etracking.store',
      password: 'Yapa@2001',
      options: {
        data: {
          name: 'Admin User',
          role: 'admin'
        }
      }
    });

    if (error) {
      console.error('Error creating admin user:', error.message);
      return;
    }

    console.log('Admin user created successfully!');
    console.log('User ID:', data.user.id);
    
    // Insert directly into profiles table
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
