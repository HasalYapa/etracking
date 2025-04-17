// Import the supabase client from lib/supabase
import { supabase } from '@/lib/supabase';

// Export the supabase client as default for backward compatibility
export default supabase;

// Export helper functions if needed
export async function getUserProfile() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}
