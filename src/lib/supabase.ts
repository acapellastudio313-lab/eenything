import { createClient } from '@supabase/supabase-js';

// Mengambil URL dan Anon Key dari file .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL atau Anon Key tidak ditemukan di .env!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);