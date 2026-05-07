'use client';
// ============================================================
// 🟢 FRONTEND — Component: SipStatus
// Indikator status koneksi SIP di pojok layar
// ============================================================

interface SipStatusProps {
  isRegistered: boolean;
  username: string;
}

export default function SipStatus({ isRegistered, username }: SipStatusProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
      <span
        className={`w-2 h-2 rounded-full ${
          isRegistered ? 'bg-green-400 animate-pulse' : 'bg-red-400'
        }`}
      />
      <span className="text-xs font-mono text-white/80">
        {username}
      </span>
      <span className="text-xs text-white/50">
        {isRegistered ? 'Terhubung' : 'Menghubungkan...'}
      </span>
    </div>
  );
}
