"use client";
import { useState, useRef } from 'react';
import {
  Video, Delete, Phone, PhoneOff, Mic, MicOff,
  Volume2, VolumeX, VideoOff, Camera
} from 'lucide-react';
import { useVoip } from '@/lib/voipProvider';
import { saveCallLog, updateCallLog } from '@/lib/supabase';

const KEYS = [
  { key: '1', sub: '' },      { key: '2', sub: 'ABC' }, { key: '3', sub: 'DEF' },
  { key: '4', sub: 'GHI' },  { key: '5', sub: 'JKL' }, { key: '6', sub: 'MNO' },
  { key: '7', sub: 'PQRS' }, { key: '8', sub: 'TUV' }, { key: '9', sub: 'WXYZ' },
  { key: '*', sub: '' },      { key: '0', sub: '+' },   { key: '#', sub: '' },
];

function formatDuration(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

const statusColor: Record<string, string> = {
  Idle: 'text-gray-400',
  Calling: 'text-yellow-500',
  Ringing: 'text-brand-primary',
  'In Call': 'text-green-500',
  'Call Ended': 'text-red-500',
  Incoming: 'text-brand-primary',
};

// ── In-Call Overlay for VOICE ──────────────────────────────────────
function VoiceCallScreen({ onEnd }: { onEnd: () => void }) {
  const { callState, callNumber, isMuted, isSpeakerOn, duration, toggleMute, toggleSpeaker } = useVoip();
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-between py-8 px-6 z-20 rounded-xl"
      style={{ background: 'linear-gradient(160deg, #3d7a7a 0%, #588B8B 60%, #4a9898 100%)' }}>
      {/* Status */}
      <div className="text-center text-white">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
          <Phone size={28} className="text-white" />
        </div>
        <p className="text-sm text-white/60 mb-1 uppercase tracking-widest animate-pulse font-medium">
          {callState}
        </p>
        <p className="text-2xl font-bold">{callNumber}</p>
        <p className="text-white/50 text-sm font-mono mt-2">{formatDuration(duration)}</p>
      </div>

      {/* Controls */}
      <div className="w-full space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Mute */}
          <button onClick={toggleMute}
            className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all ${
              isMuted ? 'bg-red-400/30 border border-red-300/50' : 'bg-white/15 border border-white/20'
            }`}>
            {isMuted ? <MicOff size={20} className="text-red-300" /> : <Mic size={20} className="text-white" />}
            <span className="text-xs text-white/80 font-medium">{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>
          {/* Speaker */}
          <button onClick={toggleSpeaker}
            className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all ${
              isSpeakerOn ? 'bg-white/25 border border-white/40' : 'bg-white/15 border border-white/20'
            }`}>
            {isSpeakerOn ? <Volume2 size={20} className="text-white" /> : <VolumeX size={20} className="text-white/70" />}
            <span className="text-xs text-white/80 font-medium">Loudspeaker</span>
          </button>
        </div>
        {/* End Call */}
        <button onClick={onEnd}
          className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-red-600 transition-colors">
          <PhoneOff size={18} /> Akhiri Panggilan
        </button>
      </div>
    </div>
  );
}

// ── In-Call Overlay for VIDEO ──────────────────────────────────────
function VideoCallScreen({ onEnd }: { onEnd: () => void }) {
  const { callState, callNumber, isMuted, isSpeakerOn, isCameraOn, duration,
    toggleMute, toggleSpeaker, toggleCamera } = useVoip();
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-between z-20 rounded-xl overflow-hidden"
      style={{ background: '#0d1117' }}>
      {/* Remote video placeholder */}
      <div className="absolute inset-0 flex items-center justify-center"
        style={{ background: 'linear-gradient(160deg, #1a2e2e 0%, #0d1f1f 100%)' }}>
        <div className="text-center text-white/30">
          <Video size={48} className="mx-auto mb-2" />
          <p className="text-sm">Video Stream</p>
        </div>
      </div>
      {/* Local video PiP */}
      <div className="absolute top-4 right-4 w-24 h-32 rounded-xl overflow-hidden border-2 border-white/20 shadow-xl"
        style={{ background: isCameraOn ? '#1a2e2e' : '#111' }}>
        {!isCameraOn && (
          <div className="w-full h-full flex items-center justify-center">
            <VideoOff size={18} className="text-white/30" />
          </div>
        )}
      </div>
      {/* Status bar */}
      <div className="relative z-10 w-full px-4 pt-4">
        <div className="flex items-center gap-2">
          <span className={`text-xs uppercase tracking-widest font-medium animate-pulse ${statusColor[callState]}`}>
            {callState}
          </span>
          <span className="text-white/40 text-xs">·</span>
          <span className="text-white/60 text-xs">{callNumber}</span>
          <span className="ml-auto text-white/50 text-xs font-mono">{formatDuration(duration)}</span>
        </div>
      </div>
      {/* Controls */}
      <div className="relative z-10 w-full px-4 pb-4">
        <div className="grid grid-cols-4 gap-2 mb-3">
          {/* Mute */}
          <button onClick={toggleMute}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all ${
              isMuted ? 'bg-red-500/40 border border-red-400/50' : 'bg-white/10 border border-white/15'
            }`}>
            {isMuted ? <MicOff size={16} className="text-red-300" /> : <Mic size={16} className="text-white" />}
            <span className="text-[10px] text-white/70">Mic</span>
          </button>
          {/* Speaker */}
          <button onClick={toggleSpeaker}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all ${
              isSpeakerOn ? 'bg-white/20 border border-white/30' : 'bg-white/10 border border-white/15'
            }`}>
            {isSpeakerOn ? <Volume2 size={16} className="text-white" /> : <VolumeX size={16} className="text-white/50" />}
            <span className="text-[10px] text-white/70">Speaker</span>
          </button>
          {/* Camera */}
          <button onClick={toggleCamera}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all ${
              !isCameraOn ? 'bg-orange-500/40 border border-orange-400/50' : 'bg-white/10 border border-white/15'
            }`}>
            {isCameraOn ? <Camera size={16} className="text-white" /> : <VideoOff size={16} className="text-orange-300" />}
            <span className="text-[10px] text-white/70">Kamera</span>
          </button>
          {/* End */}
          <button onClick={onEnd}
            className="flex flex-col items-center gap-1 py-2.5 rounded-2xl bg-red-500 border border-red-400 transition-all hover:bg-red-600">
            <PhoneOff size={16} className="text-white" />
            <span className="text-[10px] text-white">End</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main DialPad ───────────────────────────────────────────────────
export default function DialPad() {
  const [number, setNumber] = useState('');
  const callLogIdRef = useRef<string | null>(null);
  const {
    callState, callMode, callNumber,
    incomingNumber, sipState,
    startCall, endCall, answerCall, declineCall, dtmf,
  } = useVoip();

  const isActive   = callState !== 'Idle' && callState !== 'Call Ended';
  const isInCall   = callState === 'In Call';
  const isIncoming = callState === 'Incoming';
  const showVoiceScreen = isActive && callMode === 'voice' && !isIncoming;
  const showVideoScreen = isActive && callMode === 'video' && !isIncoming;

  const handleKey = (k: string) => {
    setNumber(p => p + k);
    if (isInCall) dtmf(k);
  };

  const handleCall = async (mode: 'voice' | 'video' = 'voice') => {
    if (!number) return;
    const raw = sessionStorage.getItem('voip_user');
    const { phone } = raw ? JSON.parse(raw) : {};
    if (phone) {
      try {
        const log = await saveCallLog({
          user_phone: phone,
          target_number: number,
          direction: 'outgoing',
          status: 'Calling',
          call_type: mode,
        });
        callLogIdRef.current = log?.id ?? null;
      } catch { /* offline/demo mode */ }
    }
    await startCall(number, mode);
  };

  const handleEnd = async () => {
    if (callLogIdRef.current) {
      try {
        await updateCallLog(callLogIdRef.current, {
          status: isInCall ? 'Ended' : 'Missed',
          duration_seconds: 0,
          ended_at: new Date().toISOString(),
        });
      } catch { /* offline */ }
    }
    await endCall();
  };

  return (
    <div className="max-w-sm mx-auto">
      {/* SIP status */}
      <div className="flex items-center justify-end gap-1.5 mb-3">
        <span className={`w-2 h-2 rounded-full ${
          sipState === 'registered' ? 'bg-green-500 animate-pulse' :
          sipState === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-gray-300'
        }`} />
        <span className="text-xs text-gray-400">
          {sipState === 'registered' ? 'Terhubung ke Kamailio' :
           sipState === 'connecting' ? 'Menghubungkan...' : 'Offline (mode demo)'}
        </span>
      </div>

      {/* Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden relative">

        {/* ── VOICE CALL SCREEN (overlaid) ── */}
        {showVoiceScreen && <VoiceCallScreen onEnd={handleEnd} />}
        {/* ── VIDEO CALL SCREEN (overlaid) ── */}
        {showVideoScreen && <VideoCallScreen onEnd={handleEnd} />}

        {/* ── INCOMING CALL ── */}
        {isIncoming && (
          <div className="absolute inset-0 flex flex-col items-center justify-between py-8 px-6 z-20 rounded-xl"
            style={{ background: 'linear-gradient(160deg, #588B8B 0%, #3d7a7a 100%)' }}>
            <div className="text-center text-white">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(255,255,255,0.15)' }}>
                <Phone size={28} className="text-white animate-bounce" />
              </div>
              <p className="text-sm text-white/60 uppercase tracking-widest mb-1">Panggilan Masuk</p>
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

        {/* ── Number Display ── */}
        <div className="px-4 pt-4 pb-2 border-b border-gray-100" style={{ minHeight: 72 }}>
          {callState === 'Call Ended' ? (
            <div className="text-center py-3">
              <p className="text-sm font-medium text-red-400 uppercase tracking-widest">Panggilan Berakhir</p>
            </div>
          ) : !isActive && (
            <div className="flex items-center gap-2">
              <input
                type="tel"
                value={number}
                onChange={e => setNumber(e.target.value)}
                className="flex-1 text-2xl font-display font-semibold text-gray-800 outline-none bg-transparent tracking-widest placeholder:text-gray-300 placeholder:text-lg placeholder:font-normal"
                placeholder="Nomor tujuan"
              />
              {number && (
                <button onClick={() => setNumber(p => p.slice(0, -1))}
                  className="p-1.5 text-gray-400 hover:text-gray-600">
                  <Delete size={18} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Keypad ── */}
        <div className="grid grid-cols-3 border-b border-gray-100">
          {KEYS.map(({ key, sub }) => (
            <button key={key} onClick={() => handleKey(key)}
              className="h-14 flex flex-col items-center justify-center hover:bg-gray-50 active:bg-gray-100 border-r border-b border-gray-100 last:border-r-0 transition-colors group">
              <span className="text-lg font-semibold text-gray-700 group-active:text-brand-primary leading-none">{key}</span>
              {sub && <span className="text-[9px] text-gray-400 tracking-widest mt-0.5">{sub}</span>}
            </button>
          ))}
          {[
            { label: 'R', title: 'Redial' },
            { label: '+', title: 'Plus' },
            { label: 'C', title: 'Clear' },
          ].map(({ label, title }) => (
            <button key={label} title={title}
              onClick={() => { if (label === 'C') setNumber(''); else if (label === '+') setNumber(p => p + '+'); }}
              className="h-12 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-brand-primary border-r border-gray-100 last:border-r-0 transition-colors text-sm font-medium">
              {label}
            </button>
          ))}
        </div>

        {/* ── Footer Actions ── */}
        <div className="flex items-center">
          {/* Video Call button */}
          <button
            onClick={() => handleCall('video')}
            disabled={!number || isActive}
            className="w-14 h-14 flex items-center justify-center text-gray-400 hover:text-brand-primary hover:bg-gray-50 transition-colors border-r border-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Video Call"
          >
            <Video size={20} />
          </button>

          {/* Voice Call / End */}
          <div className="flex-1 flex gap-2 px-3">
            {!isActive && callState !== 'Call Ended' ? (
              <button
                onClick={() => handleCall('voice')}
                disabled={!number}
                className="flex-1 h-10 bg-brand-primary text-white rounded-lg flex items-center justify-center gap-1.5 text-sm font-semibold hover:bg-brand-dark transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Phone size={16} fill="currentColor" /> Call
              </button>
            ) : callState === 'Call Ended' ? (
              <div className="flex-1 h-10 flex items-center justify-center text-gray-300 text-sm">
                Selesai
              </div>
            ) : null}
          </div>

          {/* Placeholder right */}
          <div className="w-14 h-14 border-l border-gray-100 flex items-center justify-center">
            <span className="text-xs text-gray-300">SIP</span>
          </div>
        </div>

        {/* Call type hint */}
        {!isActive && number && (
          <div className="px-4 pb-3 flex gap-2">
            <button onClick={() => handleCall('voice')}
              className="flex-1 text-xs py-1.5 rounded-lg border border-brand-primary/20 text-brand-primary hover:bg-brand-light transition-colors font-medium flex items-center justify-center gap-1">
              <Phone size={11} /> Voice Call
            </button>
            <button onClick={() => handleCall('video')}
              className="flex-1 text-xs py-1.5 rounded-lg border border-brand-primary/20 text-brand-primary hover:bg-brand-light transition-colors font-medium flex items-center justify-center gap-1">
              <Video size={11} /> Video Call
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
