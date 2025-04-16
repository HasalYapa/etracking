// Script to create the profiles table in Supabase
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc'; // Use the service_role key

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function createProfilesTable() {
  try {
    console.log('Creating profiles table...');
    
    // SQL to create the profiles table
    const sql = `
      -- Create profiles table if it doesn't exist
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

      -- Create policies (these will fail if they already exist, which is fine)
      DO $$
      BEGIN
        BEGIN
          CREATE POLICY "Users can view their own profile"
            ON public.profiles
            FOR SELECT
            USING (auth.uid() = id);
        EXCEPTION WHEN duplicate_object THEN
          RAISE NOTICE 'Policy "Users can view their own profile" already exists';
        END;

        BEGIN
          CREATE POLICY "Users can update their own profile"
            ON public.profiles
            FOR UPDATE
            USING (auth.uid() = id);
        EXCEPTION WHEN duplicate_object THEN
          RAISE NOTICE 'Policy "Users can update their own profile" already exists';
        END;

        BEGIN
          CREATE POLICY "Users can insert their own profile"
            ON public.profiles
            FOR INSERT
            WITH CHECK (auth.uid() = id);
        EXCEPTION WHEN duplicate_object THEN
          RAISE NOTICE 'Policy "Users can insert their own profile" already exists';
        END;

        BEGIN
          CREATE POLICY "Admin can view all profiles"
            ON public.profiles
            FOR SELECT
            USING (
              EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role = 'admin'
              )
            );
        EXCEPTION WHEN duplicate_object THEN
          RAISE NOTICE 'Policy "Admin can view all profiles" already exists';
        END;
      END $$;
    `;
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error creating profiles table:', error.message);
      
      // Try a different approach
      console.log('Trying alternative approach...');
      
      // Check if the table exists
      const { data: tables, error: tablesError } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public')
        .eq('tablename', 'profiles');
      
      if (tablesError) {
        console.error('Error checking if profiles table exists:', tablesError.message);
        return;
      }
      
      if (tables && tables.length > 0) {
        console.log('Profiles table already exists.');
      } else {
        console.log('Profiles table does not exist. Creating it manually...');
        
        // Create the table manually
        const { error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: '00000000-0000-0000-0000-000000000000', // Dummy ID
              name: 'Test User',
              email: 'test@example.com',
              role: 'test',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);
        
        if (createError) {
          console.error('Error creating profiles table manually:', createError.message);
          return;
        }
        
        console.log('Profiles table created manually.');
      }
    } else {
      console.log('Profiles table created successfully.');
    }
    
    // Test inserting a record
    console.log('Testing profile insertion...');
    const testUserId = '11111111-1111-1111-1111-111111111111'; // Another dummy ID
    
    const { error: insertError } = await supabase
      .from('profiles')
      .upsert([
        {
          id: testUserId,
          name: 'Test User 2',
          email: 'test2@example.com',
          role: 'test',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
    
    if (insertError) {
      console.error('Error inserting test profile:', insertError.message);
    } else {
      console.log('Test profile inserted successfully.');
    }
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

createProfilesTable();
