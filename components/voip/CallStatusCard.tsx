"use client";
import { PhoneOff, Mic, MicOff, Volume2 } from 'lucide-react';
import { useState } from 'react';
import type { CallState } from './DialPad';

interface Props {
  status: CallState;
  number: string;
  duration: number;
  onEnd: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const statusColors: Record<CallState, string> = {
  'Idle': 'text-gray-400',
  'Calling': 'text-yellow-300',
  'Ringing': 'text-blue-300',
  'In Call': 'text-green-400',
  'Call Ended': 'text-red-400',
};

export default function CallStatusCard({ status, number, duration, onEnd }: Props) {
  const [muted, setMuted] = useState(false);

  return (
    <div className="relative glass-dark p-10 rounded-[40px] text-white text-center max-w-sm mx-auto space-y-8 shadow-2xl overflow-hidden animate-fade-up">
      {/* Pulse rings for In Call */}
      {status === 'In Call' && (
        <>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="w-32 h-32 rounded-full border border-white/10 animate-[pulse-ring_2s_ease-out_infinite]" style={{ animationDelay: '0s' }} />
            <span className="w-32 h-32 rounded-full border border-white/10 animate-[pulse-ring_2s_ease-out_infinite] absolute" style={{ animationDelay: '0.6s' }} />
          </div>
        </>
      )}

      {/* Avatar */}
      <div className="relative z-10 space-y-4">
        <div className="w-24 h-24 bg-blue-400/20 border border-blue-300/30 rounded-full mx-auto flex items-center justify-center">
          <span className="text-4xl font-display font-bold text-white">
            {number[0] || 'V'}
          </span>
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight">{number}</h2>
          <p className={`font-medium tracking-widest uppercase text-sm mt-1 animate-pulse ${statusColors[status]}`}>
            {status}
          </p>
          {status === 'In Call' && (
            <p className="text-white/50 text-sm mt-1">{formatDuration(duration)}</p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-10 flex items-center justify-center gap-6">
        {status === 'In Call' && (
          <>
            <button
              onClick={() => setMuted(!muted)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border ${
                muted ? 'bg-red-500/30 border-red-400/40' : 'bg-white/10 border-white/20 hover:bg-white/20'
              }`}
            >
              {muted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <button className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all">
              <Volume2 size={20} />
            </button>
          </>
        )}

        {/* End Call Button */}
        <button
          onClick={onEnd}
          className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-900/40"
        >
          <PhoneOff size={26} />
        </button>
      </div>
    </div>
  );
}
