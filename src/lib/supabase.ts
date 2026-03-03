import { createClient } from '@supabase/supabase-js';

// Menggunakan casting 'as any' untuk menghindari error TypeScript pada ImportMeta di Vite
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

// Validasi untuk memastikan variabel environment sudah terisi di file .env
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("⚠️ Supabase URL atau Anon Key tidak ditemukan! Pastikan file .env sudah diisi dengan benar.");
}

// Inisialisasi client Supabase dengan konfigurasi Realtime untuk mendukung fitur ASMR dan post update
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});