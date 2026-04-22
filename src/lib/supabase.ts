import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. App will fallback to simulated data.');
}

export const supabase = createClient(
  supabaseUrl || 'https://xjxnpcxlwitvknqybsej.supabase.co',
  supabaseAnonKey || 'sb_publishable_DVN5jkAWscngvexK_3MGoA_RiRZHeUByQW-XGqV91_E'
);
