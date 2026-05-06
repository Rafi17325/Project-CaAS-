"use client";
import {
  createContext, useContext, useEffect, useRef,
  useState, ReactNode,
} from 'react';
import { SessionState, Invitation } from 'sip.js';
import {
  connectSIP, disconnectSIP, makeCall, makeVideoCall, acceptCall,
  rejectCall, hangUp, setMute, sendDTMF, setSipCallbacks,
  SipState,
} from './sipClient';

export type AppCallState =
  | 'Idle' | 'Calling' | 'Ringing' | 'In Call' | 'Call Ended' | 'Incoming';

export type CallMode = 'voice' | 'video';

interface VoipCtx {
  sipState: SipState;
  callState: AppCallState;
  callMode: CallMode;
  callNumber: string;
  isMuted: boolean;
  isSpeakerOn: boolean;
  isCameraOn: boolean;
  duration: number;
  incomingSession: Invitation | null;
  incomingNumber: string;
  startCall: (target: string, mode?: CallMode) => Promise<void>;
  endCall: () => Promise<void>;
  answerCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  toggleCamera: () => void;
  dtmf: (tone: string) => void;
}

const VoipContext = createContext<VoipCtx | null>(null);

export function VoipProvider({ children }: { children: ReactNode }) {
  const [sipState, setSipState]       = useState<SipState>('disconnected');
  const [callState, setCallState]     = useState<AppCallState>('Idle');
  const [callMode, setCallMode]       = useState<CallMode>('voice');
  const [callNumber, setCallNumber]   = useState('');
  const [isMuted, setIsMuted]         = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isCameraOn, setIsCameraOn]   = useState(true);
  const [duration, setDuration]       = useState(0);
  const [incomingSession, setIncomingSess] = useState<Invitation | null>(null);
  const [incomingNumber, setIncomingNum]   = useState('');
  const audioRef  = useRef<HTMLAudioElement | null>(null);
  const timerRef  = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const audio = document.createElement('audio');
    audio.autoplay = true;
    document.body.appendChild(audio);
    audioRef.current = audio;

    // Connect using phone number only — no SIP password required
    const raw = sessionStorage.getItem('voip_user');
    if (raw) {
      const { phone } = JSON.parse(raw);
      if (phone) {
        setSipCallbacks({
          onStateChange: setSipState,
          onCallStateChange: handleCallState,
          onIncomingCall: (inv, num) => {
            setIncomingSess(inv);
            setIncomingNum(num);
            setCallState('Incoming');
          },
        });
        connectSIP(phone).catch(console.error);
      }
    }

    return () => {
      audio.remove();
      disconnectSIP().catch(console.error);
    };
  }, []);

  function handleCallState(state: SessionState) {
    switch (state) {
      case SessionState.Establishing:
        setCallState('Ringing'); break;
      case SessionState.Established:
        setCallState('In Call');
        setDuration(0);
        timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
        break;
      case SessionState.Terminated:
        if (timerRef.current) clearInterval(timerRef.current);
        setCallState('Call Ended');
        setTimeout(() => {
          setCallState('Idle');
          setCallNumber('');
          setDuration(0);
          setCallMode('voice');
          setIsCameraOn(true);
          setIsMuted(false);
        }, 2500);
        break;
    }
  }

  async function startCall(target: string, mode: CallMode = 'voice') {
    if (!audioRef.current) return;
    setCallNumber(target);
    setCallMode(mode);
    setCallState('Calling');
    try {
      if (mode === 'video') {
        await makeVideoCall(target, audioRef.current);
      } else {
        await makeCall(target, audioRef.current);
      }
    } catch (e) {
      console.error(e);
      setCallState('Idle');
    }
  }

  async function endCall() {
    if (timerRef.current) clearInterval(timerRef.current);
    await hangUp();
    setCallState('Call Ended');
    setTimeout(() => {
      setCallState('Idle');
      setCallNumber('');
      setDuration(0);
      setCallMode('voice');
    }, 2500);
  }

  async function answerCall() {
    if (!incomingSession || !audioRef.current) return;
    setCallNumber(incomingNumber);
    await acceptCall(incomingSession, audioRef.current);
    setIncomingSess(null);
  }

  async function declineCall() {
    if (!incomingSession) return;
    await rejectCall(incomingSession);
    setIncomingSess(null);
    setCallState('Idle');
  }

  function toggleMute() {
    const next = !isMuted;
    setMute(next);
    setIsMuted(next);
  }

  function toggleSpeaker() {
    setIsSpeakerOn(p => !p);
    // Actual speaker routing via Web Audio API (implementation depends on browser)
  }

  function toggleCamera() {
    const next = !isCameraOn;
    setIsCameraOn(next);
    // Disable/enable video track
    import('./sipClient').then(({ getLocalVideoTracks }) => {
      getLocalVideoTracks().forEach(t => { t.enabled = next; });
    }).catch(() => {});
  }

  return (
    <VoipContext.Provider value={{
      sipState, callState, callMode, callNumber,
      isMuted, isSpeakerOn, isCameraOn, duration,
      incomingSession, incomingNumber,
      startCall, endCall, answerCall, declineCall,
      toggleMute, toggleSpeaker, toggleCamera,
      dtmf: sendDTMF,
    }}>
      {children}
    </VoipContext.Provider>
  );
}

export function useVoip() {
  const ctx = useContext(VoipContext);
  if (!ctx) throw new Error('useVoip harus digunakan di dalam VoipProvider');
  return ctx;
}
