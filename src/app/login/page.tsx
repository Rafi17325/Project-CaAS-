'use client';
// ============================================================
// 🟢 FRONTEND — Page: /login
// Form login dengan nomor telepon, validasi via /api/validate-user
// ============================================================
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleaned = phone.replace(/\s+/g, '').trim();
    if (!cleaned) {
      setError('Masukkan nomor telepon Anda');
      return;
    }

    setLoading(true);
    try {
      // Panggil backend API untuk validasi
      const res = await fetch('/api/validate-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleaned }),
      });

      const data = await res.json();

      if (data.valid) {
        // Simpan username di sessionStorage untuk dashboard
        sessionStorage.setItem('voip_username', cleaned);
        router.push('/dashboard');
      } else {
        setError(data.message ?? 'Nomor tidak terdaftar di server Kamailio');
      }
    } catch {
      setError('Tidak dapat terhubung ke server. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-primary/20 border border-brand-primary/30 mb-4">
            <Phone size={28} className="text-brand-primary" />
          </div>
          <h1 className="text-3xl font-semibold text-white tracking-tight">
            VoIP Portal
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Masuk dengan nomor SIP Anda
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs text-white/60 mb-1.5 uppercase tracking-wider">
              Nomor Telepon
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="08121234567"
              className="
                w-full bg-white/5 border border-white/15 rounded-xl
                px-4 py-3 text-white font-mono text-lg
                placeholder:text-white/20 focus:outline-none
                focus:border-brand-primary/60 focus:bg-white/8
                transition-all duration-200
              "
              autoFocus
              autoComplete="tel"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="
              w-full bg-brand-primary hover:bg-brand-dark
              text-white font-medium rounded-xl py-3
              flex items-center justify-center gap-2
              transition-all duration-200 active:scale-[0.98]
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Memeriksa...
              </>
            ) : (
              <>
                <Phone size={18} />
                Masuk
              </>
            )}
          </button>
        </form>

        {/* Info */}
        <p className="text-center text-white/30 text-xs mt-8">
          Sistem VoIP berbasis Kamailio + WebSIP
        </p>
      </div>
    </div>
  );
}
