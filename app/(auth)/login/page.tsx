"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Wifi, Signal, Shield, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error: dbError } = await supabase
        .from('voip_users')
        .select('phone, display_name')
        .eq('phone', phone)
        .single();

      if (dbError || !data) {
        throw new Error('Nomor tidak terdaftar di server VoIP');
      }

      sessionStorage.setItem('voip_user', JSON.stringify({
        phone: data.phone,
        displayName: data.display_name,
      }));

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message ?? 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex overflow-hidden bg-white">
      {/* LEFT PANEL */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #3d7a7a 0%, #588B8B 55%, #4a9898 100%)' }}
      >
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full"
          style={{ background: 'rgba(255,213,194,0.25)' }} />
        <div className="absolute bottom-[-60px] right-[-60px] w-96 h-96 rounded-full"
          style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="absolute top-1/2 left-[-30px] w-32 h-32 rounded-full"
          style={{ background: 'rgba(255,213,194,0.15)' }} />

        <div className="relative z-10 text-white max-w-sm text-center">
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl"
              style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(16px)', border: '1.5px solid rgba(255,255,255,0.3)' }}>
              <Wifi size={40} className="text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-extrabold mb-2 tracking-tight">VoIP Portal</h1>
          <p className="text-white/65 text-sm leading-relaxed mb-10">
            Platform komunikasi berbasis VoIP terintegrasi dengan Kamailio via SIP/UDP. Voice &amp; video call kapan saja.
          </p>

          <div className="space-y-3 text-left">
            {[
              { icon: Signal,  label: 'Voice & Video Real-time' },
              { icon: Shield,  label: 'Autentikasi via Supabase' },
              { icon: Zap,     label: 'UDP — Latensi Ultra Rendah' },
            ].map(({ icon: Icon, label }) => (
              <div key={label}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,213,194,0.3)' }}>
                  <Icon size={14} className="text-white" />
                </div>
                <span className="text-sm text-white/90 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-6 inset-x-0 text-center">
          <p className="text-white/30 text-xs">Server · 10.98.56.198 · UDP/SIP</p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-12 relative bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-lg"
            style={{ background: '#588B8B' }}>
            <Wifi size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#588B8B' }}>VoIP Portal</h1>
        </div>

        <div className="w-full max-w-[380px]">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-1.5">Selamat Datang 👋</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Masuk menggunakan nomor yang terdaftar di server VoIP Kamailio
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-600">
                Nomor Handphone
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: '#f0fafa' }}>
                  <Phone size={15} style={{ color: '#588B8B' }} />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  className="w-full pl-14 pr-4 py-4 rounded-2xl border-2 outline-none transition-all text-gray-800 placeholder:text-gray-300 text-sm font-medium"
                  style={{
                    borderColor: error ? '#ef4444' : '#eef0f3',
                    background: '#fafbfc',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = '#588B8B';
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(88,139,139,0.08)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = error ? '#ef4444' : '#eef0f3';
                    e.currentTarget.style.background = '#fafbfc';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  placeholder="0812xxxxxxxxxxxx"
                  onChange={e => { setPhone(e.target.value); setError(''); }}
                />
              </div>
              {error && (
                <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !phone}
              className="w-full py-4 rounded-2xl font-bold text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #588B8B 0%, #3d7872 100%)', boxShadow: '0 8px 24px rgba(88,139,139,0.35)' }}
            >
              <span className="flex items-center justify-center gap-2">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memverifikasi...</>
                  : <><Phone size={15} fill="currentColor" /> Masuk ke VoIP</>
                }
              </span>
            </button>
          </form>

          <div className="mt-5 flex items-center gap-2.5 p-3.5 rounded-2xl"
            style={{ background: '#f0fafa', border: '1px solid #d5e8e8' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: '#588B8B' }}>
              <Signal size={12} className="text-white" />
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#456e6e' }}>
              Hanya nomor yang terdaftar di server Kamailio yang dapat masuk
            </p>
          </div>
        </div>

        {/* Powered by footer */}
        <div className="absolute bottom-6 inset-x-0 text-center">
          <p className="text-xs text-gray-300 tracking-wide">
            Powered by{' '}
            <span className="font-semibold" style={{ color: '#588B8B' }}>Supabase</span>
            {' '}&amp;{' '}
            <span className="font-semibold" style={{ color: '#588B8B' }}>VoIP Kamailio</span>
          </p>
        </div>
      </div>
    </main>
  );
}
