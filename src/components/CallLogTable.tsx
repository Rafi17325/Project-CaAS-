'use client';
// ============================================================
// 🟢 FRONTEND — Component: CallLogTable
// Tabel riwayat panggilan dengan realtime update dari Supabase
// ============================================================
import { useEffect, useState } from 'react';
import { PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import { supabase, type CallHistoryRow } from '@/lib/supabase';

interface CallLogTableProps {
  username: string;
}

const typeIcon = {
  received: <PhoneIncoming size={14} className="text-green-400" />,
  outgoing: <PhoneOutgoing size={14} className="text-brand-primary" />,
  missed: <PhoneMissed size={14} className="text-red-400" />,
};

const typeLabel = {
  received: 'Masuk',
  outgoing: 'Keluar',
  missed: 'Tidak Terjawab',
};

export default function CallLogTable({ username }: CallLogTableProps) {
  const [logs, setLogs] = useState<CallHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('call_history')
        .select('*')
        .eq('username', username)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) setLogs(data);
      setLoading(false);
    };

    fetchLogs();

    // Realtime subscription
    const channel = supabase
      .channel('call_history_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_history',
          filter: `username=eq.${username}`,
        },
        (payload) => {
          setLogs(prev => [payload.new as CallHistoryRow, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [username]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-white/40 text-sm">
        Memuat riwayat...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-white/40 text-sm gap-2">
        <PhoneOutgoing size={24} className="opacity-30" />
        <p>Belum ada riwayat panggilan</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wider">
            <th className="text-left py-2 px-3 font-medium">Tipe</th>
            <th className="text-left py-2 px-3 font-medium">Nomor</th>
            <th className="text-left py-2 px-3 font-medium">Media</th>
            <th className="text-left py-2 px-3 font-medium">Durasi</th>
            <th className="text-left py-2 px-3 font-medium">Waktu</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, idx) => (
            <tr
              key={log.id}
              className={`
                border-b border-white/5 hover:bg-white/5 transition-colors
                animate-fade-up
              `}
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-1.5">
                  {typeIcon[log.type_call]}
                  <span className="text-white/70 text-xs">{typeLabel[log.type_call]}</span>
                </div>
              </td>
              <td className="py-2.5 px-3 font-mono text-white text-xs">
                {log.type_call === 'outgoing' ? log.target : log.username}
              </td>
              <td className="py-2.5 px-3">
                <span className={`
                  text-xs px-2 py-0.5 rounded-full font-medium
                  ${log.type === 'Video'
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'bg-brand-primary/20 text-brand-muted'
                  }
                `}>
                  {log.type}
                </span>
              </td>
              <td className="py-2.5 px-3 font-mono text-white/70 text-xs">
                {log.duration || '—'}
              </td>
              <td className="py-2.5 px-3 text-white/40 text-xs">
                {new Date(log.created_at).toLocaleString('id-ID', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
