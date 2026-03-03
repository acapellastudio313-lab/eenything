import { createClient } from '@supabase/supabase-js';

// Menggunakan 'as any' agar TypeScript tidak error saat membaca ImportMeta di Vite
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("⚠️ Supabase URL atau Anon Key tidak ditemukan! Pastikan file .env sudah diisi dengan benar.");
}

// Inisialisasi client Supabase dengan fitur Realtime aktif
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});