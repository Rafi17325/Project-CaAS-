// ============================================================
// 🔵 LIB/SHARED — Supabase Client
// Digunakan oleh frontend (realtime) dan bisa diakses backend
// ============================================================
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Types Supabase row ────────────────────────────────────────
export interface CallHistoryRow {
  id: string;
  username: string;          // nomor penelepon (e.g. 08121234567)
  target: string;            // nomor tujuan
  type: 'Voice' | 'Video';
  type_call: 'outgoing' | 'received' | 'missed';
  duration: string;          // MM:SS
  started_at: string;        // ISO timestamp
  ended_at: string | null;
  created_at: string;
}

// ── Helper: simpan call ke Supabase ──────────────────────────
export async function saveCallHistory(
  data: Omit<CallHistoryRow, 'id' | 'created_at'>
) {
  const { error } = await supabase.from('call_history').insert(data);
  if (error) console.error('[Supabase] saveCallHistory error:', error.message);
}
