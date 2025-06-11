import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://snkyczysawxjrpmvtzqy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNua3ljenlzYXd4anJwbXZ0enF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1NzcxNjgsImV4cCI6MjA1NzE1MzE2OH0.MrStn3bzcTckif5uofljpPM9YnfEOcW1YV58lX7U6GE';

if (!supabaseUrl) throw new Error('Missing Supabase URL');
if (!supabaseKey) throw new Error('Missing Supabase Key');

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  }
}); 