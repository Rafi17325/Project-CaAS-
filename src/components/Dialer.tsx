'use client';
// ============================================================
// 🟢 FRONTEND — Component: Dialer
// Keypad telepon dengan tombol call/hangup/mute
// ============================================================
import { useState, useCallback } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Delete } from 'lucide-react';
import type { CallStatus } from '../../types/voip';

interface DialerProps {
  isRegistered: boolean;
  callStatus: CallStatus | null;
  currentTarget: string | null;
  callDuration: number;
  isMuted: boolean;
  onCall: (target: string) => void;
  onHangUp: () => void;
  onToggleMute: () => void;
}

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function Dialer({
  isRegistered,
  callStatus,
  currentTarget,
  callDuration,
  isMuted,
  onCall,
  onHangUp,
  onToggleMute,
}: DialerProps) {
  const [input, setInput] = useState('');

  const handleKey = useCallback((key: string) => {
    setInput(prev => prev + key);
  }, []);

  const handleDelete = useCallback(() => {
    setInput(prev => prev.slice(0, -1));
  }, []);

  const handleCall = useCallback(() => {
    if (input.trim()) onCall(input.trim());
  }, [input, onCall]);

  const isInCall = callStatus === 'In Call' || callStatus === 'Calling' || callStatus === 'Ringing';

  return (
    <div className="flex flex-col items-center w-full max-w-xs mx-auto">
      {/* Display nomor */}
      <div className="relative w-full mb-4">
        <div className="w-full bg-brand-dark/30 rounded-2xl px-5 py-4 text-center">
          {isInCall ? (
            <div className="space-y-1">
              <p className="text-brand-accent text-xs font-mono uppercase tracking-widest">
                {callStatus}
              </p>
              <p className="text-white text-xl font-mono">{currentTarget}</p>
              {callStatus === 'In Call' && (
                <p className="text-brand-muted text-sm font-mono">
                  {formatDuration(callDuration)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-white text-2xl font-mono tracking-widest min-h-[2rem]">
              {input || <span className="text-white/30">Masukkan nomor</span>}
            </p>
          )}
        </div>
        {/* Delete button */}
        {!isInCall && input && (
          <button
            onClick={handleDelete}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
          >
            <Delete size={18} />
          </button>
        )}
      </div>

      {/* Keypad */}
      {!isInCall && (
        <div className="grid grid-cols-3 gap-3 w-full mb-4">
          {KEYS.map((row) =>
            row.map((key) => (
              <button
                key={key}
                onClick={() => handleKey(key)}
                className="
                  aspect-square rounded-2xl bg-white/10 hover:bg-white/20
                  active:scale-95 transition-all duration-100
                  text-white text-xl font-light
                  flex items-center justify-center
                  border border-white/10 hover:border-white/20
                "
              >
                {key}
              </button>
            ))
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-4 mt-2">
        {isInCall ? (
          <>
            {/* Mute toggle */}
            <button
              onClick={onToggleMute}
              className={`
                w-14 h-14 rounded-full flex items-center justify-center
                transition-all duration-200 border
                ${isMuted
                  ? 'bg-yellow-500/20 border-yellow-400/50 text-yellow-300'
                  : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
                }
              `}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {/* Hang up */}
            <button
              onClick={onHangUp}
              className="
                w-16 h-16 rounded-full bg-red-500 hover:bg-red-600
                flex items-center justify-center text-white
                shadow-lg shadow-red-500/30 transition-all active:scale-95
              "
            >
              <PhoneOff size={24} />
            </button>
          </>
        ) : (
          /* Call button */
          <button
            onClick={handleCall}
            disabled={!isRegistered || !input.trim()}
            className="
              w-16 h-16 rounded-full bg-brand-primary hover:bg-brand-dark
              flex items-center justify-center text-white
              shadow-lg shadow-brand-primary/30 transition-all active:scale-95
              disabled:opacity-40 disabled:cursor-not-allowed
            "
          >
            <Phone size={24} />
          </button>
        )}
      </div>

      {/* Status hint */}
      {!isRegistered && (
        <p className="mt-4 text-xs text-white/40 text-center">
          Menghubungkan ke server SIP...
        </p>
      )}
    </div>
  );
}
