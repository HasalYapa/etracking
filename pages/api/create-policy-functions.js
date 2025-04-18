import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  // Create authenticated Supabase client
  const supabase = createPagesServerClient({ req, res });
  
  // Get the current user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    // Create the function to drop existing policies
    const dropFunctionSQL = `
      CREATE OR REPLACE FUNCTION drop_profile_policies()
      RETURNS void AS $$
      BEGIN
        -- Drop all existing policies on the profiles table
        DROP POLICY IF EXISTS "Users can view their own profile." ON profiles;
        DROP POLICY IF EXISTS "Users can update their own profile." ON profiles;
        DROP POLICY IF EXISTS "Profiles are viewable by users who created them." ON profiles;
        DROP POLICY IF EXISTS "Profiles are editable by users who created them." ON profiles;
        DROP POLICY IF EXISTS "Admins can view all profiles." ON profiles;
        DROP POLICY IF EXISTS "Admins can edit all profiles." ON profiles;
        DROP POLICY IF EXISTS "Shop owners can view their own profile." ON profiles;
        DROP POLICY IF EXISTS "Shop owners can edit their own profile." ON profiles;
        DROP POLICY IF EXISTS "Drivers can view their own profile." ON profiles;
        DROP POLICY IF EXISTS "Drivers can edit their own profile." ON profiles;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    const { error: dropFunctionError } = await supabase.rpc('drop_profile_policies');
    
    if (dropFunctionError && !dropFunctionError.message.includes('does not exist')) {
      // If the function doesn't exist yet, create it
      const { error: createDropFunctionError } = await supabase.query(dropFunctionSQL);
      
      if (createDropFunctionError) {
        console.error('Error creating drop function:', createDropFunctionError);
        return res.status(500).json({ error: 'Failed to create drop function', details: createDropFunctionError });
      }
    }
    
    // Create the function to create new, safe policies
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION create_safe_profile_policies()
      RETURNS void AS $$
      BEGIN
        -- Enable RLS on profiles table
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        -- Create simple policies that won't cause recursion
        CREATE POLICY "Public profiles are viewable by everyone."
          ON profiles FOR SELECT
          USING (true);
          
        CREATE POLICY "Users can update own profile."
          ON profiles FOR UPDATE
          USING (auth.uid() = id);
          
        CREATE POLICY "Users can insert own profile."
          ON profiles FOR INSERT
          WITH CHECK (auth.uid() = id);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    const { error: createFunctionError } = await supabase.rpc('create_safe_profile_policies');
    
    if (createFunctionError && !createFunctionError.message.includes('does not exist')) {
      // If the function doesn't exist yet, create it
      const { error: createCreateFunctionError } = await supabase.query(createFunctionSQL);
      
      if (createCreateFunctionError) {
        console.error('Error creating create function:', createCreateFunctionError);
        return res.status(500).json({ error: 'Failed to create create function', details: createCreateFunctionError });
      }
    }
    
    return res.status(200).json({ success: true, message: 'Policy functions created successfully' });
  } catch (error) {
    console.error('Error creating policy functions:', error);
    return res.status(500).json({ error: 'Failed to create policy functions', details: error });
  }
}
