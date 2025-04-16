// Script to check if the profiles table exists and create it if it doesn't
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc'; // Use the service_role key

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfilesTable() {
  try {
    console.log('Checking if profiles table exists...');
    
    // List all tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('Error listing tables:', tablesError.message);
      return;
    }
    
    console.log('Tables in the database:', tables.map(t => t.table_name));
    
    // Check if profiles table exists
    const profilesTable = tables.find(t => t.table_name === 'profiles');
    
    if (profilesTable) {
      console.log('Profiles table exists. Checking its structure...');
      
      // Check table structure
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'profiles')
        .eq('table_schema', 'public');
      
      if (columnsError) {
        console.error('Error getting columns:', columnsError.message);
        return;
      }
      
      console.log('Columns in profiles table:', columns);
    } else {
      console.log('Profiles table does not exist. Creating it...');
      
      // Create profiles table using SQL
      const { error: createError } = await supabase.rpc('create_profiles_table');
      
      if (createError) {
        console.error('Error creating profiles table:', createError.message);
        console.log('Trying alternative method to create profiles table...');
        
        // Try creating the table using raw SQL
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS public.profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            name TEXT,
            email TEXT,
            role TEXT,
            shop_name TEXT,
            phone TEXT,
            address TEXT,
            vehicle_type TEXT,
            vehicle_number TEXT,
            license_number TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
          
          -- Set up Row Level Security
          ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
          
          -- Create policies
          CREATE POLICY "Users can view their own profile"
            ON public.profiles
            FOR SELECT
            USING (auth.uid() = id);
            
          CREATE POLICY "Users can update their own profile"
            ON public.profiles
            FOR UPDATE
            USING (auth.uid() = id);
            
          CREATE POLICY "Admin can view all profiles"
            ON public.profiles
            FOR SELECT
            USING (
              EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role = 'admin'
              )
            );
        `;
        
        const { error: sqlError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
        
        if (sqlError) {
          console.error('Error creating profiles table with SQL:', sqlError.message);
          return;
        }
        
        console.log('Profiles table created successfully using SQL.');
      } else {
        console.log('Profiles table created successfully.');
      }
    }
    
    // Try to insert a test profile
    console.log('Trying to insert a test profile...');
    const testProfileId = '00000000-0000-0000-0000-000000000000'; // A dummy UUID
    
    // First check if the test profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testProfileId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking for test profile:', checkError.message);
    } else if (existingProfile) {
      console.log('Test profile already exists:', existingProfile);
    } else {
      // Insert test profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: testProfileId,
          name: 'Test User',
          email: 'test@example.com',
          role: 'test',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Error inserting test profile:', insertError.message);
        console.log('Error details:', insertError);
      } else {
        console.log('Test profile inserted successfully.');
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

checkProfilesTable();
