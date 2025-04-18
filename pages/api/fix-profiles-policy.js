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
    // Drop the existing policy that's causing the infinite recursion
    const { error: dropError } = await supabase.rpc('drop_profile_policies');
    
    if (dropError) {
      console.error('Error dropping policies:', dropError);
      return res.status(500).json({ error: 'Failed to drop policies', details: dropError });
    }
    
    // Create a new, simpler policy for the profiles table
    const { error: createError } = await supabase.rpc('create_safe_profile_policies');
    
    if (createError) {
      console.error('Error creating policies:', createError);
      return res.status(500).json({ error: 'Failed to create policies', details: createError });
    }
    
    return res.status(200).json({ success: true, message: 'Profiles policies fixed successfully' });
  } catch (error) {
    console.error('Error fixing profiles policies:', error);
    return res.status(500).json({ error: 'Failed to fix profiles policies', details: error });
  }
}
