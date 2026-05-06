"use client";
import { useState, useRef, useEffect } from 'react';
import {
  Video, Delete, Phone, PhoneOff, Mic, MicOff,
  VideoOff, Camera,
} from 'lucide-react';
import { useVoip } from '@/lib/voipProvider';

const KEYS = [
  { key: '1', sub: '' },      { key: '2', sub: 'ABC' }, { key: '3', sub: 'DEF' },
  { key: '4', sub: 'GHI' },  { key: '5', sub: 'JKL' }, { key: '6', sub: 'MNO' },
  { key: '7', sub: 'PQRS' }, { key: '8', sub: 'TUV' }, { key: '9', sub: 'WXYZ' },
  { key: '*', sub: '' },      { key: '0', sub: '+' },   { key: '#', sub: '' },
];

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
}

/* ── Voice call overlay ─────────────────────────────────────────── */
function VoiceScreen({ onEnd }: { onEnd: () => void }) {
  const { callState, callNumber, isMuted, duration, toggleMute } = useVoip();
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between py-8 px-6 rounded-xl"
      style={{ background: 'linear-gradient(160deg,#3d7a7a 0%,#588B8B 60%,#4a9898 100%)' }}>
      {/* Info */}
      <div className="text-center text-white">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.15)' }}>
          <Phone size={28} className="text-white" />
        </div>
        <p className="text-xs text-white/60 uppercase tracking-widest mb-1 animate-pulse">{callState}</p>
        <p className="text-2xl font-bold">{callNumber}</p>
        <p className="text-white/50 font-mono text-sm mt-2">{fmt(duration)}</p>
      </div>
      {/* Controls */}
      <div className="w-full space-y-3">
        <button onClick={toggleMute}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl transition-all ${
            isMuted ? 'bg-red-400/40 border border-red-300/50' : 'bg-white/15 border border-white/20'}`}>
          {isMuted ? <MicOff size={18} className="text-red-300" /> : <Mic size={18} className="text-white" />}
          <span className="text-sm text-white font-medium">{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
        </button>
        <button onClick={onEnd}
          className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold flex items-center justify-center gap-2">
          <PhoneOff size={18} /> Akhiri Panggilan
        </button>
      </div>
    </div>
  );
}

/* ── Video call overlay ─────────────────────────────────────────── */
function VideoScreen({ onEnd }: { onEnd: () => void }) {
  const {
    callState, callNumber, isMuted, isCameraOn, duration,
    localStream, remoteStream,
    toggleMute, toggleCamera,
  } = useVoip();

  const localRef  = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);

  // Pasang stream ke elemen video secara langsung
  useEffect(() => {
    if (localRef.current && localStream) {
      localRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current && remoteStream) {
      remoteRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col rounded-xl overflow-hidden bg-black">
      {/* Remote video (full screen) */}
      <video ref={remoteRef} autoPlay playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ background: '#111' }} />

      {/* Fallback jika belum ada stream */}
      {!remoteStream && (
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'linear-gradient(160deg,#1a2e2e 0%,#0d1f1f 100%)' }}>
          <div className="text-center text-white/30">
            <Video size={48} className="mx-auto mb-2" />
            <p className="text-sm">Menunggu video...</p>
          </div>
        </div>
      )}

      {/* Local video PiP (pojok kanan atas) */}
      <div className="absolute top-4 right-4 w-28 h-36 rounded-xl overflow-hidden border-2 border-white/20 shadow-xl bg-black z-10">
        {isCameraOn
          ? <video ref={localRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <VideoOff size={18} className="text-white/40" />
            </div>}
      </div>

      {/* Status bar */}
      <div className="relative z-10 px-4 pt-4">
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-xl px-3 py-2">
          <span className="text-xs text-white/60 uppercase tracking-widest animate-pulse">{callState}</span>
          <span className="text-white/30">·</span>
          <span className="text-white/80 text-xs font-medium">{callNumber}</span>
          <span className="ml-auto text-white/50 text-xs font-mono">{fmt(duration)}</span>
        </div>
      </div>

      {/* Controls bar */}
      <div className="relative z-10 mt-auto px-4 pb-4">
        <div className="grid grid-cols-4 gap-2 bg-black/40 backdrop-blur-sm rounded-2xl p-3">
          {/* Mute */}
          <button onClick={toggleMute}
            className={`flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${
              isMuted ? 'bg-red-500/50 border border-red-400/60' : 'bg-white/10 border border-white/15'}`}>
            {isMuted ? <MicOff size={18} className="text-red-300" /> : <Mic size={18} className="text-white" />}
            <span className="text-[10px] text-white/70">{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          {/* Camera on/off */}
          <button onClick={toggleCamera}
            className={`flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${
              !isCameraOn ? 'bg-orange-500/40 border border-orange-400/50' : 'bg-white/10 border border-white/15'}`}>
            {isCameraOn
              ? <Camera size={18} className="text-white" />
              : <VideoOff size={18} className="text-orange-300" />}
            <span className="text-[10px] text-white/70">{isCameraOn ? 'Kamera' : 'Off'}</span>
          </button>

          {/* Spacer */}
          <div />

          {/* End call */}
          <button onClick={onEnd}
            className="flex flex-col items-center gap-1 py-3 rounded-xl bg-red-500 border border-red-400 hover:bg-red-600 transition-all">
            <PhoneOff size={18} className="text-white" />
            <span className="text-[10px] text-white font-medium">End</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main DialPad ────────────────────────────────────────────────── */
export default function DialPad() {
  const [number, setNumber] = useState('');
  const {
    callState, callMode, callNumber,
    incomingNumber, sipState,
    startCall, endCall, answerCall, declineCall,
  } = useVoip();

  const isActive   = callState !== 'Idle' && callState !== 'Call Ended';
  const isIncoming = callState === 'Incoming';
  const showVoice  = isActive && callMode === 'voice' && !isIncoming;
  const showVideo  = isActive && callMode === 'video' && !isIncoming;

  const handleKey = (k: string) => setNumber(p => p + k);

  const handleCall = async (mode: 'voice' | 'video') => {
    if (!number) return;
    await startCall(number, mode);
  };

  const handleEnd = async () => { await endCall(); };

  return (
    <div className="max-w-sm mx-auto">
      {/* SIP status */}
      <div className="flex items-center justify-end gap-1.5 mb-3">
        <span className={`w-2 h-2 rounded-full ${
          sipState === 'registered' ? 'bg-green-500 animate-pulse' :
          sipState === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-gray-300'}`} />
        <span className="text-xs text-gray-400">
          {sipState === 'registered' ? 'Terhubung ke Kamailio' :
           sipState === 'connecting' ? 'Menghubungkan...' : 'Tidak terhubung'}
        </span>
      </div>

      {/* Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden relative" style={{ minHeight: 480 }}>

        {/* Overlays */}
        {showVoice  && <VoiceScreen onEnd={handleEnd} />}
        {showVideo  && <VideoScreen onEnd={handleEnd} />}

        {/* Incoming call overlay */}
        {isIncoming && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-between py-8 px-6 rounded-xl"
            style={{ background: 'linear-gradient(160deg,#588B8B 0%,#3d7a7a 100%)' }}>
            <div className="text-center text-white">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.15)' }}>
                <Phone size={28} className="text-white animate-bounce" />
              </div>
              <p className="text-xs text-white/60 uppercase tracking-widest mb-1">Panggilan Masuk</p>
              <p className="text-2xl font-bold">{incomingNumber}</p>
              <p className="text-white/50 text-sm mt-1 animate-pulse">Ringing...</p>
            </div>
            <div className="flex gap-4 w-full">
              <button onClick={declineCall}
                className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white font-bold flex items-center justify-center gap-2">
                <PhoneOff size={16} /> Tolak
              </button>
              <button onClick={answerCall}
                className="flex-1 py-3.5 rounded-2xl bg-green-500 text-white font-bold flex items-center justify-center gap-2">
                <Phone size={16} fill="currentColor" /> Angkat
              </button>
            </div>
          </div>
        )}

        {/* Number display */}
        <div className="px-4 pt-4 pb-2 border-b border-gray-100" style={{ minHeight: 68 }}>
          {callState === 'Call Ended' ? (
            <p className="text-center py-3 text-sm font-medium text-red-400 uppercase tracking-widest">Panggilan Berakhir</p>
          ) : !isActive && (
            <div className="flex items-center gap-2">
              <input type="tel" value={number}
                onChange={e => setNumber(e.target.value)}
                className="flex-1 text-2xl font-bold text-gray-800 outline-none bg-transparent tracking-widest placeholder:text-gray-200 placeholder:text-lg placeholder:font-normal"
                placeholder="Nomor tujuan" />
              {number && (
                <button onClick={() => setNumber(p => p.slice(0,-1))}
                  className="p-1.5 text-gray-400 hover:text-gray-600">
                  <Delete size={18} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 border-b border-gray-100">
          {KEYS.map(({ key, sub }) => (
            <button key={key} onClick={() => handleKey(key)}
              className="h-14 flex flex-col items-center justify-center hover:bg-gray-50 active:bg-gray-100 border-r border-b border-gray-100 last:border-r-0 transition-colors group">
              <span className="text-lg font-semibold text-gray-700 leading-none">{key}</span>
              {sub && <span className="text-[9px] text-gray-400 tracking-widest mt-0.5">{sub}</span>}
            </button>
          ))}
        </div>

        {/* Action row */}
        {!isActive && callState !== 'Call Ended' && (
          <div className="px-4 py-4 flex gap-3">
            <button onClick={() => handleCall('voice')} disabled={!number}
              className="flex-1 py-3 rounded-xl bg-brand-primary text-white font-bold flex items-center justify-center gap-2 disabled:opacity-40 shadow-sm hover:opacity-90 transition-all">
              <Phone size={16} fill="currentColor" /> Voice
            </button>
            <button onClick={() => handleCall('video')} disabled={!number}
              className="flex-1 py-3 rounded-xl text-brand-primary font-bold flex items-center justify-center gap-2 disabled:opacity-40 border-2 border-brand-primary hover:bg-brand-light transition-all">
              <Video size={16} /> Video
            </button>
          </div>
        )}

        {callState === 'Call Ended' && (
          <div className="px-4 py-4 text-center text-gray-300 text-sm">Selesai</div>
        )}
      </div>
    </div>
  );
}
