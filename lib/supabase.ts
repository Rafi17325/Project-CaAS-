import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } },
});

// ─── CALL LOG ────────────────────────────────────────────────────

export async function saveCallLog(log: {
  user_phone: string;
  target_number: string;
  direction: 'outgoing' | 'incoming' | 'missed';
  status: string;
  duration_seconds?: number;
  call_type?: 'voice' | 'video';
}) {
  const { data, error } = await supabase
    .from('call_history')
    .insert({
      user_phone:       log.user_phone,
      target_number:    log.target_number,
      direction:        log.direction,
      status:           log.status,
      duration_seconds: log.duration_seconds ?? 0,
      call_type:        log.call_type ?? 'voice',
      ended_at:         log.status === 'Ended' ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCallLog(id: string, updates: Record<string, unknown>) {
  const { error } = await supabase
    .from('call_history')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function getCallHistory(userPhone: string) {
  const { data, error } = await supabase
    .from('call_history')
    .select('*')
    .eq('user_phone', userPhone)
    .order('started_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}
