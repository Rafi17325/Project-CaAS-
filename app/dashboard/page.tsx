"use client";
import { useEffect, useState } from 'react';
import { Phone, PhoneIncoming, PhoneMissed, Clock, Video } from 'lucide-react';
import Link from 'next/link';
import { getCallHistory } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

interface CallLog {
  id: string;
  target_number: string;
  direction: 'outgoing' | 'incoming' | 'missed';
  status: string;
  duration_seconds: number;
  started_at: string;
  call_type?: string;
}

function fmtDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}j ${m}m`;
  if (m > 0) return `${m}m ${s}d`;
  return `${s}d`;
}

function fmtTime(iso: string) {
  const d = new Date(iso), now = new Date();
  const hrs = (now.getTime() - d.getTime()) / 3600000;
  if (hrs < 24) return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  if (hrs < 48) return 'Kemarin';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

const quickMenus = [
  { label: 'Dial Pad', desc: 'Mulai panggilan baru', href: '/dashboard/dialpad', emoji: '📞' },
  { label: 'Call Log', desc: 'Riwayat panggilan', href: '/dashboard/call-log', emoji: '📋' },
  { label: 'About', desc: 'Profil & info aplikasi', href: '/dashboard/about', emoji: '👤' },
];

export default function DashboardPage() {
  const [logs, setLogs]           = useState<CallLog[]>([]);
  const [loading, setLoading]     = useState(true);
  const [userName, setUserName]   = useState('');
  const [isLive, setIsLive]       = useState(false);

  const getUserPhone = () => {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem('voip_user');
    if (!raw) return null;
    const u = JSON.parse(raw);
    setUserName(u.displayName ?? u.phone);
    return u.phone as string;
  };

  useEffect(() => {
    const phone = getUserPhone();
    if (!phone) { setLoading(false); return; }

    getCallHistory(phone).then(data => {
      setLogs(data as CallLog[]);
      setLoading(false);
    });

    // Realtime sync
    const channel = supabase
      .channel(`dashboard_${phone}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'call_history',
        filter: `user_phone=eq.${phone}`,
      }, payload => {
        setLogs(prev => [payload.new as CallLog, ...prev]);
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'call_history',
        filter: `user_phone=eq.${phone}`,
      }, payload => {
        setLogs(prev => prev.map(l => l.id === (payload.new as CallLog).id ? payload.new as CallLog : l));
      })
      .subscribe(status => setIsLive(status === 'SUBSCRIBED'));

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Computed stats from real data
  const totalCalls    = logs.length;
  const received      = logs.filter(l => l.direction === 'incoming' && l.status === 'Ended').length;
  const missed        = logs.filter(l => l.direction === 'missed' || l.status === 'Missed').length;
  const totalDuration = logs.reduce((acc, l) => acc + (l.duration_seconds ?? 0), 0);

  const stats = [
    { label: 'Total Panggilan', value: loading ? '...' : String(totalCalls),       icon: Phone,        color: 'bg-[#e8f5f5] text-[#588B8B]' },
    { label: 'Diterima',        value: loading ? '...' : String(received),          icon: PhoneIncoming, color: 'bg-green-50 text-green-700' },
    { label: 'Tidak Terjawab',  value: loading ? '...' : String(missed),            icon: PhoneMissed,  color: 'bg-red-50 text-red-600' },
    { label: 'Total Durasi',    value: loading ? '...' : fmtDuration(totalDuration), icon: Clock,        color: 'bg-[#fff3ee] text-[#cc7a5a]' },
  ];

  const recentLogs = logs.slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Selamat datang{userName ? `, ${userName}` : ''} — VoIP Kamailio
          </p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
          isLive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          {isLive ? 'Live Sync' : 'Offline'}
        </div>
      </div>

      {/* Stats Grid — real data from call_history */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="glass p-5 rounded-2xl shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon size={20} />
            </div>
            <p className="text-2xl font-display font-bold text-gray-800">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Menu */}
      <div>
        <h2 className="font-display font-semibold text-gray-700 mb-4">Menu Utama</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickMenus.map(m => (
            <Link
              key={m.label}
              href={m.href}
              className="glass p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <span className="text-3xl mb-3 block">{m.emoji}</span>
              <h3 className="font-display font-bold text-gray-800 group-hover:text-brand-primary transition-colors">
                {m.label}
              </h3>
              <p className="text-sm text-gray-400 mt-1">{m.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Call Log — synced from call_history */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-gray-700">Riwayat Terbaru</h2>
          <Link href="/dashboard/call-log"
            className="text-xs text-brand-primary font-medium hover:underline">
            Lihat semua →
          </Link>
        </div>

        <div className="glass rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-10 text-center">
              <div className="w-5 h-5 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-300 text-xs">Memuat riwayat...</p>
            </div>
          ) : recentLogs.length === 0 ? (
            <div className="py-10 text-center">
              <Phone size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-gray-300 text-sm">Belum ada riwayat panggilan</p>
            </div>
          ) : (
            <div className="divide-y divide-brand-primary/10">
              {recentLogs.map(log => {
                const isVideo = log.call_type === 'video';
                const dirColors = {
                  incoming: 'bg-green-50 text-green-700',
                  outgoing: 'bg-[#e8f5f5] text-[#588B8B]',
                  missed:   'bg-red-50 text-red-600',
                };
                const colorClass = dirColors[log.direction] ?? dirColors.outgoing;
                return (
                  <div key={log.id}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-brand-light/40 transition-colors">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      {isVideo ? <Video size={15} /> : <Phone size={15} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">{log.target_number}</p>
                      <p className="text-xs text-gray-400 capitalize">
                        {log.direction === 'incoming' ? 'Masuk' : log.direction === 'missed' ? 'Tidak Terjawab' : 'Keluar'}
                        {' · '}{isVideo ? 'Video' : 'Voice'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500 font-mono">
                        {String(Math.floor(log.duration_seconds / 60)).padStart(2,'0')}:
                        {String(log.duration_seconds % 60).padStart(2,'0')}
                      </p>
                      <p className="text-xs text-gray-400">{fmtTime(log.started_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
