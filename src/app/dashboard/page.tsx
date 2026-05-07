'use client';
// ============================================================
// 🟢 FRONTEND — Page: /dashboard
// Dashboard utama: Dialer + Call Log + Status SIP
// ============================================================
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import Dialer from '@/components/Dialer';
import CallLogTable from '@/components/CallLogTable';
import SipStatus from '@/components/SipStatus';
import { useSip } from '@/hooks/useSip';
import { saveCallHistory } from '@/lib/supabase';

function formatDurationStr(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState<'dialer' | 'log'>('dialer');

  // Ambil username dari sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('voip_username');
    if (!stored) {
      router.replace('/login');
      return;
    }
    setUsername(stored);
  }, [router]);

  // Callback saat call berakhir → simpan ke Supabase
  const handleCallEnded = useCallback(
    async (durationSeconds: number, target: string) => {
      if (!username) return;
      await saveCallHistory({
        username,
        target,
        type: 'Voice',
        type_call: 'outgoing',
        duration: formatDurationStr(durationSeconds),
        started_at: new Date(Date.now() - durationSeconds * 1000).toISOString(),
        ended_at: new Date().toISOString(),
      });
    },
    [username]
  );

  const sipServer = process.env.NEXT_PUBLIC_SIP_SERVER ?? '';
  const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL ?? '';
  const defaultPassword = process.env.NEXT_PUBLIC_SIP_DEFAULT_PASSWORD ?? username;

  const {
    isRegistered,
    callStatus,
    currentTarget,
    callDuration,
    isMuted,
    makeCall,
    hangUp,
    toggleMute,
  } = useSip({
    username,
    password: defaultPassword,
    websocketUrl,
    sipServer,
    onCallEnded: handleCallEnded,
  });

  const handleLogout = () => {
    sessionStorage.removeItem('voip_username');
    router.push('/login');
  };

  if (!username) return null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <h1 className="text-white font-semibold text-lg">VoIP Portal</h1>
          <SipStatus isRegistered={isRegistered} username={username} />
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-white/50 hover:text-white/80 text-sm transition-colors"
        >
          <LogOut size={15} />
          Keluar
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {/* Tab navigation */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-6 border border-white/10">
          {(['dialer', 'log'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${activeTab === tab
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-white/50 hover:text-white/70'
                }
              `}
            >
              {tab === 'dialer' ? '📞 Dial' : '📋 Riwayat'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'dialer' ? (
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <Dialer
              isRegistered={isRegistered}
              callStatus={callStatus}
              currentTarget={currentTarget}
              callDuration={callDuration}
              isMuted={isMuted}
              onCall={makeCall}
              onHangUp={hangUp}
              onToggleMute={toggleMute}
            />
          </div>
        ) : (
          <div className="bg-white/5 rounded-2xl border border-white/10 p-4 min-h-[300px]">
            <CallLogTable username={username} />
          </div>
        )}
      </main>
    </div>
  );
}
