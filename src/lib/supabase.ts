import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Solo lanzar error en tiempo de ejecución, no durante el build
if (typeof window !== 'undefined') {
  if (!supabaseUrl) throw new Error('Missing Supabase URL');
  if (!supabaseKey) throw new Error('Missing Supabase Key');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  }
}); 