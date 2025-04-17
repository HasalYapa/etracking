import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role for server-side operations
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.Oi-qL8YYgYONxGEDGYEDgRdKvJXW0LYVpNYwUJTv0Zc';

// This client should only be used in server-side contexts (API routes, Server Components, etc.)
// It has admin privileges and should never be exposed to the client
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

export default supabaseService;
