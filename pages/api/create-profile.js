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
    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', session.user.id)
      .maybeSingle();
    
    if (fetchError) {
      console.error('Error fetching profile:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch profile', details: fetchError });
    }
    
    // If profile exists, return it
    if (existingProfile) {
      return res.status(200).json({ success: true, profile: existingProfile, message: 'Profile already exists' });
    }
    
    // Create a new profile
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: session.user.id,
        email: session.user.email,
        role: req.body?.role || 'shop_owner', // Default to shop_owner if no role provided
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating profile:', insertError);
      return res.status(500).json({ error: 'Failed to create profile', details: insertError });
    }
    
    return res.status(201).json({ success: true, profile: newProfile, message: 'Profile created successfully' });
  } catch (error) {
    console.error('Error in create-profile API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
