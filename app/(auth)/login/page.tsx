"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Wifi, Signal, Shield, Zap, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [phone,   setPhone]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [status,  setStatus]  = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const clean = phone.trim().replace(/\s/g, '');

    try {
      setStatus('Menghubungi server Kamailio...');
      const res  = await fetch('/api/validate-user', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone: clean }),
      });
      const data = await res.json();

      if (data.server_unreachable) throw new Error(data.error);
      if (!data.valid)             throw new Error(data.error ?? 'Nomor tidak terdaftar');

      setStatus('Terverifikasi ✓');
      sessionStorage.setItem('voip_user', JSON.stringify({ phone: data.phone }));
      setTimeout(() => router.push('/dashboard'), 300);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login gagal');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex overflow-hidden bg-white">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-14 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg,#3d7a7a 0%,#588B8B 55%,#4a9898 100%)' }}>
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full" style={{ background: 'rgba(255,213,194,0.22)' }} />
        <div className="absolute -bottom-16 -right-16 w-96 h-96 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }} />

        <div className="relative z-10 text-white max-w-sm text-center">
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 rounded-[28px] flex items-center justify-center shadow-2xl"
              style={{ background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(16px)', border: '1.5px solid rgba(255,255,255,0.28)' }}>
              <Wifi size={42} className="text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">VoIP Portal</h1>
          <p className="text-white/60 text-sm leading-relaxed mb-10">
            Platform komunikasi berbasis VoIP terintegrasi dengan Kamailio.<br />
            Voice &amp; video call via SIP / UDP melalui Nginx.
          </p>
          <div className="space-y-3 text-left">
            {[
              { Icon: Signal, text: 'Voice & Video Call real-time' },
              { Icon: Shield, text: 'Validasi nomor langsung dari Kamailio' },
              { Icon: Zap,    text: 'UDP via Nginx — latensi rendah' },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.11)', border: '1px solid rgba(255,255,255,0.17)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,213,194,0.28)' }}>
                  <Icon size={14} className="text-white" />
                </div>
                <span className="text-sm text-white/90 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-6 inset-x-0 text-center">
          <p className="text-white/28 text-xs">Server · {process.env.NEXT_PUBLIC_SIP_SERVER ?? '10.98.56.137'} · UDP/SIP via Nginx</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-12 relative bg-white">
        <div className="lg:hidden flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-lg" style={{ background: '#588B8B' }}>
            <Wifi size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#588B8B' }}>VoIP Portal</h1>
        </div>

        <div className="w-full max-w-[380px]">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-1.5">Selamat Datang 👋</h2>
            <p className="text-gray-400 text-sm">Masuk menggunakan nomor yang terdaftar di server VoIP Kamailio</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-600">Nomor Handphone</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: '#f0fafa' }}>
                  <Phone size={15} style={{ color: '#588B8B' }} />
                </div>
                <input
                  type="tel" required value={phone}
                  placeholder="0812xxxxxxxxxxxx"
                  className="w-full pl-14 pr-4 py-4 rounded-2xl border-2 outline-none transition-all text-gray-800 placeholder:text-gray-300 text-sm font-medium"
                  style={{ borderColor: error ? '#ef4444' : '#eef0f3', background: '#fafbfc' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#588B8B'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(88,139,139,0.08)'; }}
                  onBlur={e  => { e.currentTarget.style.borderColor = error ? '#ef4444' : '#eef0f3'; e.currentTarget.style.boxShadow = 'none'; }}
                  onChange={e => { setPhone(e.target.value); setError(''); setStatus(''); }}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 mt-2 p-3 rounded-xl bg-red-50 border border-red-100">
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-600 text-xs">{error}</p>
                </div>
              )}
              {status && !error && (
                <p className="text-green-600 text-xs mt-2 font-medium">{status}</p>
              )}
            </div>

            <button type="submit" disabled={loading || !phone.trim()}
              className="w-full py-4 rounded-2xl font-bold text-white text-sm transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#588B8B 0%,#3d7872 100%)', boxShadow: '0 8px 24px rgba(88,139,139,0.32)' }}>
              <span className="flex items-center justify-center gap-2">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memverifikasi...</>
                  : <><Phone size={15} fill="currentColor" /> Masuk ke VoIP</>}
              </span>
            </button>
          </form>

          <div className="mt-5 flex items-center gap-2.5 p-3.5 rounded-2xl"
            style={{ background: '#f0fafa', border: '1px solid #d5e8e8' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#588B8B' }}>
              <Signal size={12} className="text-white" />
            </div>
            <p className="text-xs" style={{ color: '#456e6e' }}>
              Nomor divalidasi langsung dari server Kamailio — tidak perlu password SIP
            </p>
          </div>
        </div>

        <div className="absolute bottom-6 inset-x-0 text-center">
          <p className="text-xs text-gray-300">
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
