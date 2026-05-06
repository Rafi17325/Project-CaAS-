/**
 * supabase.ts
 * Supabase digunakan HANYA untuk menyimpan call_history.
 * Tidak ada tabel voip_users — autentikasi via Kamailio JSONRPC.
 */
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { realtime: { params: { eventsPerSecond: 10 } } },
);

export interface CallHistoryRecord {
  id?:              string;
  user_phone:       string;
  target_number:    string;
  direction:        'outgoing' | 'incoming' | 'missed';
  status:           'Calling' | 'Ringing' | 'In Call' | 'Ended' | 'Missed';
  call_type:        'voice' | 'video';
  duration_seconds: number;
  started_at?:      string;
  ended_at?:        string | null;
}

/** INSERT baris baru saat panggilan dimulai */
export async function saveCallLog(
  log: Omit<CallHistoryRecord, 'id' | 'started_at' | 'ended_at'>,
): Promise<CallHistoryRecord> {
  const { data, error } = await supabase
    .from('call_history')
    .insert(log)
    .select()
    .single();
  if (error) throw error;
  return data as CallHistoryRecord;
}

/** UPDATE status + durasi saat panggilan selesai */
export async function updateCallLog(
  id: string,
  updates: Partial<Pick<CallHistoryRecord, 'status' | 'duration_seconds' | 'ended_at'>>,
): Promise<void> {
  const { error } = await supabase
    .from('call_history')
    .update({ ...updates, ended_at: updates.ended_at ?? new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

/** SELECT riwayat panggilan untuk user, diurutkan terbaru */
export async function getCallHistory(
  userPhone: string,
  limit = 100,
): Promise<CallHistoryRecord[]> {
  const { data, error } = await supabase
    .from('call_history')
    .select('*')
    .eq('user_phone', userPhone)
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as CallHistoryRecord[];
}
