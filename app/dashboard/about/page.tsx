"use client";
import { useEffect, useState } from 'react';
import { Wifi, Server, Shield, Globe, Phone } from 'lucide-react';
import { useVoip } from '@/lib/voipProvider';

export default function AboutPage() {
  const [user, setUser] = useState<{ phone: string; displayName: string } | null>(null);
  const { sipState } = useVoip();

  useEffect(() => {
    const raw = sessionStorage.getItem('voip_user');
    if (raw) setUser(JSON.parse(raw));
  }, []);

  const sipBadge =
    sipState === 'registered' ? { text: 'Terhubung ke Kamailio', cls: 'bg-green-50 text-green-600' } :
    sipState === 'connecting'  ? { text: 'Menghubungkan...', cls: 'bg-yellow-50 text-yellow-600' } :
    { text: 'Offline / Mode Demo', cls: 'bg-gray-100 text-gray-400' };

  return (
    <div className="animate-fade-up space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-gray-900">Tentang Aplikasi</h1>
        <p className="text-gray-400 mt-1">Informasi pengguna dan sistem VoIP</p>
      </div>

      {/* User Card */}
      <div className="glass p-8 rounded-3xl shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-brand-primary flex items-center justify-center shadow-lg">
            <span className="text-white font-display font-bold text-3xl">
              {user?.displayName?.[0] ?? user?.phone?.[0] ?? 'U'}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-gray-900">{user?.displayName ?? 'User VoIP'}</h2>
            <div className="flex items-center gap-1.5 mt-0.5 text-gray-400 text-sm">
              <Phone size={13} />
              <span className="font-mono">{user?.phone ?? '—'}</span>
            </div>
            <span className={`inline-flex items-center gap-1.5 mt-2 text-xs px-3 py-1 rounded-full font-medium ${sipBadge.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sipState === 'registered' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              {sipBadge.text}
            </span>
          </div>
        </div>
      </div>

      {/* Tech info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { Icon: Server, title: 'Server Kamailio', desc: 'IP: 10.98.56.137 — SIP server untuk otentikasi & routing panggilan' },
          { Icon: Wifi,   title: 'Protokol SIP/UDP', desc: 'Komunikasi via SIP over UDP. Browser menggunakan WebSocket sebagai transport' },
          { Icon: Shield, title: 'Autentikasi', desc: 'Login menggunakan nomor & password SIP yang terdaftar di Kamailio' },
          { Icon: Globe,  title: 'SIP.js + WebRTC', desc: 'Library SIP.js menjembatani WebSocket ↔ SIP, audio via WebRTC bawaan browser' },
        ].map(({ Icon, title, desc }) => (
          <div key={title} className="glass p-5 rounded-2xl">
            <div className="w-10 h-10 bg-brand-light text-brand-primary rounded-xl flex items-center justify-center mb-3">
              <Icon size={20} />
            </div>
            <h3 className="font-display font-semibold text-gray-800">{title}</h3>
            <p className="text-sm text-gray-400 mt-1">{desc}</p>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-300">VoIP Kamailio Web Client v0.1.0 · Next.js 14 · SIP.js</p>
    </div>
  );
}
