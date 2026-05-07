'use client';
// ============================================================
// 🟢 FRONTEND — Custom Hook: useSip
// Mengelola koneksi SIP.js: register, call, hangup, mute
// ============================================================
import { useEffect, useRef, useState, useCallback } from 'react';
import type { CallStatus } from '../../types/voip';

interface UseSipOptions {
  username: string;
  password: string;
  websocketUrl: string;
  sipServer: string;
  onCallEnded?: (durationSeconds: number, target: string) => void;
}

export function useSip({
  username,
  password,
  websocketUrl,
  sipServer,
  onCallEnded,
}: UseSipOptions) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus | null>(null);
  const [currentTarget, setCurrentTarget] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uaRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callStartRef = useRef<number>(0);

  // Mulai timer durasi call
  const startTimer = useCallback(() => {
    callStartRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - callStartRef.current) / 1000));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const dur = Math.floor((Date.now() - callStartRef.current) / 1000);
    setCallDuration(0);
    return dur;
  }, []);

  // Init SIP UserAgent
  useEffect(() => {
    if (!username || !websocketUrl || !sipServer) return;

    let destroyed = false;

    const initSip = async () => {
      try {
        const { UserAgent, Registerer, RegistererState } = await import('sip.js');

        const uri = UserAgent.makeURI(`sip:${username}@${sipServer}`);
        if (!uri) return;

        const ua = new UserAgent({
          uri,
          authorizationUsername: username,
          authorizationPassword: password,
          transportOptions: { server: websocketUrl },
          logLevel: 'warn',
        });

        uaRef.current = ua;

        // Registerer
        const registerer = new Registerer(ua);
        registerer.stateChange.addListener((state: string) => {
          if (destroyed) return;
          if (state === RegistererState.Registered) {
            setIsRegistered(true);
          } else if (state === RegistererState.Unregistered) {
            setIsRegistered(false);
          }
        });

        // Handle incoming call
        ua.delegate = {
          onInvite(invitation) {
            if (destroyed) return;
            sessionRef.current = invitation;
            setCurrentTarget(invitation.remoteIdentity.uri.user ?? 'Unknown');
            setCallStatus('Ringing');

            invitation.stateChange.addListener((state: string) => {
              if (state === 'Established') {
                setCallStatus('In Call');
                startTimer();
              } else if (state === 'Terminated') {
                const dur = stopTimer();
                onCallEnded?.(dur, invitation.remoteIdentity.uri.user ?? '');
                setCallStatus('Ended');
                setCurrentTarget(null);
                sessionRef.current = null;
              }
            });
          },
        };

        await ua.start();
        await registerer.register();
      } catch (err) {
        console.error('[SIP] Init error:', err);
      }
    };

    initSip();

    return () => {
      destroyed = true;
      stopTimer();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      uaRef.current?.stop().catch(() => {});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, password, websocketUrl, sipServer]);

  // Buat panggilan keluar
  const makeCall = useCallback(async (target: string) => {
    if (!uaRef.current || !isRegistered) return;

    try {
      const { Inviter, SessionState } = await import('sip.js');

      const targetUri = UserAgent_makeURI(target, sipServer);
      if (!targetUri) return;

      const inviter = new Inviter(uaRef.current, targetUri, {
        sessionDescriptionHandlerOptions: {
          constraints: { audio: true, video: false },
        },
      });

      sessionRef.current = inviter;
      setCurrentTarget(target);
      setCallStatus('Calling');

      inviter.stateChange.addListener((state: string) => {
        if (state === SessionState.Establishing) setCallStatus('Ringing');
        if (state === SessionState.Established) {
          setCallStatus('In Call');
          startTimer();
          // Simpan stream lokal untuk mute
          const pc = inviter.sessionDescriptionHandler?.peerConnection;
          if (pc) {
            const senders = pc.getSenders();
            const audioSender = senders.find(s => s.track?.kind === 'audio');
            if (audioSender?.track) {
              const stream = new MediaStream([audioSender.track]);
              localStreamRef.current = stream;
            }
          }
        }
        if (state === SessionState.Terminated) {
          const dur = stopTimer();
          onCallEnded?.(dur, target);
          setCallStatus('Ended');
          setCurrentTarget(null);
          sessionRef.current = null;
          setIsMuted(false);
        }
      });

      await inviter.invite();
    } catch (err) {
      console.error('[SIP] makeCall error:', err);
      setCallStatus(null);
    }
  }, [isRegistered, sipServer, startTimer, stopTimer, onCallEnded]);

  // Tutup panggilan
  const hangUp = useCallback(async () => {
    if (!sessionRef.current) return;
    try {
      const session = sessionRef.current;
      if (session.state === 'Established') {
        await session.bye();
      } else {
        await session.cancel?.() ?? session.reject?.();
      }
    } catch (err) {
      console.error('[SIP] hangUp error:', err);
    }
  }, []);

  // Toggle mute via MediaStreamTrack langsung
  const toggleMute = useCallback(() => {
    const pc = sessionRef.current?.sessionDescriptionHandler?.peerConnection;
    if (!pc) return;

    const senders = pc.getSenders();
    senders.forEach((sender: RTCRtpSender) => {
      if (sender.track?.kind === 'audio') {
        sender.track.enabled = isMuted; // toggle
      }
    });
    setIsMuted(prev => !prev);
  }, [isMuted]);

  return {
    isRegistered,
    callStatus,
    currentTarget,
    callDuration,
    isMuted,
    makeCall,
    hangUp,
    toggleMute,
  };
}

// Helper karena tidak bisa import UserAgent di scope module
function UserAgent_makeURI(user: string, server: string) {
  try {
    const { UserAgent } = require('sip.js');
    return UserAgent.makeURI(`sip:${user}@${server}`);
  } catch {
    return null;
  }
}
