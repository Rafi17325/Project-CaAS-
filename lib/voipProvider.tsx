"use client";
import {
  createContext, useContext, useEffect, useRef,
  useState, ReactNode, useCallback,
} from 'react';
import { SessionState, Invitation } from 'sip.js';
import {
  connectSIP, disconnectSIP, makeCall, makeVideoCall, acceptCall,
  rejectCall, hangUp, setMute, setCameraEnabled, setSipCallbacks,
  getLocalStream, SipState,
} from './sipClient';
import { saveCallLog, updateCallLog } from './supabase';

export type AppCallState =
  | 'Idle' | 'Calling' | 'Ringing' | 'In Call' | 'Call Ended' | 'Incoming';

export type CallMode = 'voice' | 'video';

interface VoipCtx {
  sipState: SipState;
  callState: AppCallState;
  callMode: CallMode;
  callNumber: string;
  isMuted: boolean;
  isCameraOn: boolean;
  duration: number;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  incomingSession: Invitation | null;
  incomingNumber: string;
  startCall: (target: string, mode?: CallMode) => Promise<void>;
  endCall: () => Promise<void>;
  answerCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  toggleMute: () => void;
  toggleCamera: () => void;
}

const VoipContext = createContext<VoipCtx | null>(null);

export function VoipProvider({ children }: { children: ReactNode }) {
  const [sipState,       setSipState]       = useState<SipState>('disconnected');
  const [callState,      setCallState]      = useState<AppCallState>('Idle');
  const [callMode,       setCallMode]       = useState<CallMode>('voice');
  const [callNumber,     setCallNumber]     = useState('');
  const [isMuted,        setIsMuted]        = useState(false);
  const [isCameraOn,     setIsCameraOn]     = useState(true);
  const [duration,       setDuration]       = useState(0);
  const [localStream,    setLocalStream]    = useState<MediaStream | null>(null);
  const [remoteStream,   setRemoteStream]   = useState<MediaStream | null>(null);
  const [incomingSession, setIncomingSession] = useState<Invitation | null>(null);
  const [incomingNumber,  setIncomingNumber]  = useState('');

  const audioRef     = useRef<HTMLAudioElement | null>(null);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const callStartRef = useRef<number>(0);
  const callLogIdRef = useRef<string | null>(null);

  const getUserPhone = () => {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem('voip_user');
    return raw ? (JSON.parse(raw).phone as string) : null;
  };

  // Simpan / update call_history di Supabase
  const saveLog = useCallback(async (
    phone: string, target: string,
    direction: 'outgoing' | 'incoming',
    mode: CallMode,
  ) => {
    try {
      const rec = await saveCallLog({
        user_phone:       phone,
        target_number:    target,
        direction,
        status:           'Calling',
        call_type:        mode,
        duration_seconds: 0,
      });
      callLogIdRef.current = rec?.id ?? null;
    } catch (e) {
      console.warn('saveCallLog error:', e);
    }
  }, []);

  const finishLog = useCallback(async (ended: boolean) => {
    if (!callLogIdRef.current) return;
    const durationSec = ended
      ? Math.floor((Date.now() - callStartRef.current) / 1000)
      : 0;
    try {
      await updateCallLog(callLogIdRef.current, {
        status:           ended ? 'Ended' : 'Missed',
        duration_seconds: durationSec,
        ended_at:         new Date().toISOString(),
      });
    } catch (e) {
      console.warn('updateCallLog error:', e);
    }
    callLogIdRef.current = null;
  }, []);

  const handleCallState = useCallback((state: SessionState) => {
    switch (state) {
      case SessionState.Establishing:
        setCallState('Ringing');
        break;
      case SessionState.Established:
        setCallState('In Call');
        callStartRef.current = Date.now();
        setDuration(0);
        timerRef.current = setInterval(
          () => setDuration(() => Math.floor((Date.now() - callStartRef.current) / 1000)),
          1000,
        );
        break;
      case SessionState.Terminated:
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        const wasInCall = callState === 'In Call';
        finishLog(wasInCall);
        setCallState('Call Ended');
        setTimeout(() => {
          setCallState('Idle');
          setCallNumber('');
          setDuration(0);
          setCallMode('voice');
          setIsCameraOn(true);
          setIsMuted(false);
          setLocalStream(null);
          setRemoteStream(null);
        }, 2500);
        break;
    }
  }, [callState, finishLog]);

  useEffect(() => {
    const audio = document.createElement('audio');
    audio.autoplay = true;
    document.body.appendChild(audio);
    audioRef.current = audio;

    const phone = getUserPhone();
    if (phone) {
      setSipCallbacks({
        onStateChange:     setSipState,
        onCallStateChange: handleCallState,
        onLocalStream:     (s) => setLocalStream(s),
        onRemoteStream:    (s) => {
          setRemoteStream(s);
          audio.srcObject = s;
          audio.play().catch(() => {});
        },
        onIncomingCall: (inv, num) => {
          setIncomingSession(inv);
          setIncomingNumber(num);
          setCallState('Incoming');
        },
      });
      connectSIP(phone).catch(console.error);
    }

    return () => {
      audio.remove();
      if (timerRef.current) clearInterval(timerRef.current);
      disconnectSIP().catch(() => {});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCall(target: string, mode: CallMode = 'voice') {
    if (!audioRef.current) return;
    const phone = getUserPhone();
    setCallNumber(target);
    setCallMode(mode);
    setCallState('Calling');
    setIsMuted(false);
    setIsCameraOn(true);

    if (phone) await saveLog(phone, target, 'outgoing', mode);

    try {
      if (mode === 'video') {
        await makeVideoCall(target, audioRef.current);
      } else {
        await makeCall(target, audioRef.current);
      }
      setLocalStream(getLocalStream());
    } catch (e) {
      console.error(e);
      await finishLog(false);
      setCallState('Idle');
    }
  }

  async function endCall() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const wasInCall = callState === 'In Call';
    await hangUp();
    await finishLog(wasInCall);
    setCallState('Call Ended');
    setTimeout(() => {
      setCallState('Idle');
      setCallNumber('');
      setDuration(0);
      setCallMode('voice');
      setLocalStream(null);
      setRemoteStream(null);
    }, 2500);
  }

  async function answerCall() {
    if (!incomingSession || !audioRef.current) return;
    const phone = getUserPhone();
    setCallNumber(incomingNumber);
    if (phone) await saveLog(phone, incomingNumber, 'incoming', 'voice');
    await acceptCall(incomingSession, audioRef.current, false);
    setLocalStream(getLocalStream());
    setIncomingSession(null);
  }

  async function declineCall() {
    if (!incomingSession) return;
    await rejectCall(incomingSession);
    const phone = getUserPhone();
    if (phone) {
      try {
        const rec = await saveCallLog({
          user_phone: phone, target_number: incomingNumber,
          direction: 'missed', status: 'Missed', call_type: 'voice', duration_seconds: 0,
        });
        if (rec?.id) await updateCallLog(rec.id, { ended_at: new Date().toISOString(), status: 'Missed' });
      } catch { /* offline */ }
    }
    setIncomingSession(null);
    setCallState('Idle');
  }

  function toggleMute() {
    const next = !isMuted;
    setMute(next);
    setIsMuted(next);
  }

  function toggleCamera() {
    const next = !isCameraOn;
    setCameraEnabled(next);
    setIsCameraOn(next);
  }

  return (
    <VoipContext.Provider value={{
      sipState, callState, callMode, callNumber,
      isMuted, isCameraOn, duration,
      localStream, remoteStream,
      incomingSession, incomingNumber,
      startCall, endCall, answerCall, declineCall,
      toggleMute, toggleCamera,
    }}>
      {children}
    </VoipContext.Provider>
  );
}

export function useVoip() {
  const ctx = useContext(VoipContext);
  if (!ctx) throw new Error('useVoip harus di dalam VoipProvider');
  return ctx;
}
