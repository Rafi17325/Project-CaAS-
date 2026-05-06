"use client";
import { useEffect, useState, useCallback } from 'react';
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, RefreshCw, Radio } from 'lucide-react';
import { getCallHistory, supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface CallLog {
  id: string;
  target_number: string;
  direction: 'outgoing' | 'incoming' | 'missed';
  status: string;
  duration_seconds: number;
  started_at: string;
}

const DIR_CFG = {
  incoming: { Icon: PhoneIncoming, badge: 'bg-green-50 text-green-700',        label: 'Masuk' },
  outgoing: { Icon: PhoneOutgoing, badge: 'bg-brand-light text-brand-primary', label: 'Keluar' },
  missed:   { Icon: PhoneMissed,   badge: 'bg-red-50 text-red-600',            label: 'Tidak Terjawab' },
};

function fmtDuration(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
}

function fmtTime(iso: string) {
  const d = new Date(iso), now = new Date();
  const hrs = (now.getTime() - d.getTime()) / 3600000;
  if (hrs < 24) return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  if (hrs < 48) return 'Kemarin';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

type Filter = 'all' | 'incoming' | 'outgoing' | 'missed';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',      label: 'Semua' },
  { key: 'incoming', label: 'Masuk' },
  { key: 'outgoing', label: 'Keluar' },
  { key: 'missed',   label: 'Tidak Terjawab' },
];

export default function CallLogTable() {
  const [logs, setLogs]         = useState<CallLog[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<Filter>('all');
  const [isLive, setIsLive]     = useState(false);
  const [newRow, setNewRow]     = useState<string | null>(null); // id of newly added row

  // Ambil nomor user yang login
  const getUserPhone = () => {
    const raw = sessionStorage.getItem('voip_user');
    return raw ? JSON.parse(raw).phone as string : null;
  };

  const load = useCallback(async () => {
    const phone = getUserPhone();
    if (!phone) { setLoading(false); return; }
    setLoading(true);
    const data = await getCallHistory(phone);
    setLogs(data as CallLog[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();

    const phone = getUserPhone();
    if (!phone) return;

    // ── Supabase Realtime subscription ──────────────────────────
    let channel: RealtimeChannel;

    channel = supabase
      .channel(`call_log_${phone}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_history',
          filter: `user_phone=eq.${phone}`,
        },
        (payload) => {
          const newLog = payload.new as CallLog;
          setLogs(prev => [newLog, ...prev]);
          setNewRow(newLog.id);
          setTimeout(() => setNewRow(null), 2000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_history',
          filter: `user_phone=eq.${phone}`,
        },
        (payload) => {
          const updated = payload.new as CallLog;
          setLogs(prev => prev.map(l => l.id === updated.id ? updated : l));
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const filtered = filter === 'all' ? logs : logs.filter(l => l.direction === filter);

  return (
    <div className="space-y-4">
      {/* Filter bar + status realtime */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f.key
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'glass text-gray-500 hover:text-brand-primary'
              }`}
            >
              {f.label}
              {f.key !== 'all' && (
                <span className="ml-1.5 opacity-60">
                  {logs.filter(l => l.direction === f.key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Realtime indicator */}
          <div className={`flex items-center gap-1.5 text-xs ${isLive ? 'text-green-600' : 'text-gray-400'}`}>
            <Radio size={12} className={isLive ? 'animate-pulse' : ''} />
            {isLive ? 'Live' : 'Offline'}
          </div>
          <button
            onClick={load}
            className="p-1.5 text-gray-400 hover:text-brand-primary transition-colors rounded-lg hover:bg-brand-light"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto glass rounded-2xl shadow-sm">
        {loading ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin mx-auto" />
            <p className="text-gray-300 text-sm">Memuat data...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <PhoneMissed size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-300 text-sm">Belum ada riwayat panggilan</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-brand-primary/10">
                {['Nomor Tujuan', 'Jenis', 'Status', 'Durasi', 'Waktu'].map(h => (
                  <th key={h} className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => {
                const cfg = DIR_CFG[log.direction] ?? DIR_CFG.outgoing;
                const isNew = log.id === newRow;
                return (
                  <tr
                    key={log.id}
                    className={`border-b border-brand-primary/10 last:border-0 transition-all duration-500 ${
                      isNew
                        ? 'bg-green-50/60'
                        : 'hover:bg-brand-light/60'
                    }`}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.badge}`}>
                          <cfg.Icon size={14} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{log.target_number}</p>
                          <p className="text-xs text-gray-400">Voice</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                        log.status === 'Ended'   ? 'bg-gray-100 text-gray-600' :
                        log.status === 'In Call' ? 'bg-green-50 text-green-600' :
                        log.status === 'Missed'  ? 'bg-red-50 text-red-500' :
                        'bg-yellow-50 text-yellow-600'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-sm font-mono">
                      {fmtDuration(log.duration_seconds)}
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-gray-600">{fmtTime(log.started_at)}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-center text-xs text-gray-300">
          {filtered.length} panggilan · {isLive ? '🟢 Realtime aktif' : '⚫ Realtime tidak aktif'}
        </p>
      )}
    </div>
  );
}
