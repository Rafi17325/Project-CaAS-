/**
 * sipClient.ts
 * Koneksi ke Kamailio via Nginx reverse proxy (bukan langsung ke port 8080).
 * Browser → Nginx (/ws) → Kamailio (UDP 5060)
 * Protocol internal Kamailio: UDP
 */

import {
  UserAgent,
  Registerer,
  RegistererState,
  Inviter,
  Invitation,
  Session,
  SessionState,
  UserAgentOptions,
} from 'sip.js';

export type SipState = 'disconnected' | 'connecting' | 'registered' | 'error';
export type CallDirection = 'outgoing' | 'incoming';

let ua: UserAgent | null = null;
let registerer: Registerer | null = null;
let activeSession: Session | null = null;
let localStream: MediaStream | null = null;

export interface SipCallbacks {
  onStateChange: (state: SipState) => void;
  onCallStateChange: (state: SessionState, direction: CallDirection) => void;
  onIncomingCall: (session: Invitation, callerNumber: string) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onLocalStream?: (stream: MediaStream) => void;
}

let callbacks: SipCallbacks | null = null;

export function setSipCallbacks(cb: SipCallbacks) {
  callbacks = cb;
}

/**
 * Hubungkan ke Kamailio via Nginx proxy.
 * URL: NEXT_PUBLIC_WEBSOCKET_URL = ws://IP_SERVER/ws
 * Nginx meneruskan ke Kamailio port 8080 (WebSocket internal).
 * Kamailio kemudian menggunakan UDP 5060 secara internal.
 */
export async function connectSIP(phone: string): Promise<void> {
  const sipServer = process.env.NEXT_PUBLIC_SIP_SERVER ?? '10.98.56.137';
  // Koneksi melalui Nginx proxy — BUKAN langsung ke port Kamailio
  const proxyUrl  = process.env.NEXT_PUBLIC_WEBSOCKET_URL ?? `ws://${sipServer}/ws`;
  const sipPass   = process.env.NEXT_PUBLIC_SIP_DEFAULT_PASSWORD ?? phone;

  callbacks?.onStateChange('connecting');

  const options: UserAgentOptions = {
    uri: UserAgent.makeURI(`sip:${phone}@${sipServer}`),
    transportOptions: {
      server:              proxyUrl,
      traceSip:            false,
      connectionTimeout:   10,
    },
    authorizationUsername: phone,
    authorizationPassword: sipPass,
    userAgentString: 'VoIP-Portal/1.0',
    sessionDescriptionHandlerFactoryOptions: {
      peerConnectionConfiguration: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    },
    delegate: {
      onInvite: (invitation: Invitation) => {
        const raw = invitation.remoteIdentity.uri.toString();
        const callerNumber = raw.replace(/^sip:|@.*/gi, '');
        callbacks?.onIncomingCall(invitation, callerNumber);
      },
    },
  };

  ua = new UserAgent(options);
  await ua.start();

  registerer = new Registerer(ua);
  registerer.stateChange.addListener((state: RegistererState) => {
    if (state === RegistererState.Registered)   callbacks?.onStateChange('registered');
    if (state === RegistererState.Unregistered) callbacks?.onStateChange('disconnected');
  });

  await registerer.register();
}

/** Voice call — audio only */
export async function makeCall(
  target: string,
  remoteAudio: HTMLAudioElement,
): Promise<Session> {
  if (!ua) throw new Error('SIP belum terhubung');
  const sipServer = process.env.NEXT_PUBLIC_SIP_SERVER ?? '10.98.56.137';
  const uri = UserAgent.makeURI(`sip:${target}@${sipServer}`);
  if (!uri) throw new Error('Nomor tujuan tidak valid');

  // Minta izin mikrofon sebelum invite
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  callbacks?.onLocalStream?.(localStream);

  const inviter = new Inviter(ua, uri, {
    sessionDescriptionHandlerOptions: {
      constraints: { audio: true, video: false },
    },
  });

  inviter.stateChange.addListener((state: SessionState) => {
    callbacks?.onCallStateChange(state, 'outgoing');
    if (state === SessionState.Established) {
      attachRemoteAudio(inviter, remoteAudio);
    }
    if (state === SessionState.Terminated) {
      releaseLocalStream();
    }
  });

  await inviter.invite();
  activeSession = inviter;
  return inviter;
}

/** Video call — audio + kamera */
export async function makeVideoCall(
  target: string,
  remoteAudio: HTMLAudioElement,
): Promise<Session> {
  if (!ua) throw new Error('SIP belum terhubung');
  const sipServer = process.env.NEXT_PUBLIC_SIP_SERVER ?? '10.98.56.137';
  const uri = UserAgent.makeURI(`sip:${target}@${sipServer}`);
  if (!uri) throw new Error('Nomor tujuan tidak valid');

  // Minta izin kamera + mikrofon
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
  callbacks?.onLocalStream?.(localStream);

  const inviter = new Inviter(ua, uri, {
    sessionDescriptionHandlerOptions: {
      constraints: { audio: true, video: true },
    },
  });

  inviter.stateChange.addListener((state: SessionState) => {
    callbacks?.onCallStateChange(state, 'outgoing');
    if (state === SessionState.Established) {
      attachRemoteAudio(inviter, remoteAudio);
      attachRemoteVideo(inviter);
    }
    if (state === SessionState.Terminated) {
      releaseLocalStream();
    }
  });

  await inviter.invite();
  activeSession = inviter;
  return inviter;
}

/** Terima panggilan masuk */
export async function acceptCall(
  invitation: Invitation,
  remoteAudio: HTMLAudioElement,
  withVideo = false,
): Promise<void> {
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: withVideo,
  });
  callbacks?.onLocalStream?.(localStream);

  await invitation.accept({
    sessionDescriptionHandlerOptions: {
      constraints: { audio: true, video: withVideo },
    },
  });
  activeSession = invitation;

  invitation.stateChange.addListener((state: SessionState) => {
    callbacks?.onCallStateChange(state, 'incoming');
    if (state === SessionState.Established) {
      attachRemoteAudio(invitation, remoteAudio);
      if (withVideo) attachRemoteVideo(invitation);
    }
    if (state === SessionState.Terminated) {
      releaseLocalStream();
    }
  });
}

export async function rejectCall(invitation: Invitation): Promise<void> {
  await invitation.reject();
}

export async function hangUp(): Promise<void> {
  if (!activeSession) return;
  try {
    if (activeSession.state === SessionState.Established) {
      await (activeSession as Inviter).bye?.();
    } else {
      await (activeSession as Inviter).cancel?.();
    }
  } catch { /* ignore */ }
  activeSession = null;
  releaseLocalStream();
}

export function setMute(muted: boolean): void {
  // Toggle dari localStream langsung (lebih reliable)
  if (localStream) {
    localStream.getAudioTracks().forEach(t => { t.enabled = !muted; });
    return;
  }
  // Fallback via PeerConnection
  getPeerConnection()?.getSenders().forEach(s => {
    if (s.track?.kind === 'audio') s.track.enabled = !muted;
  });
}

export function setCameraEnabled(enabled: boolean): void {
  if (localStream) {
    localStream.getVideoTracks().forEach(t => { t.enabled = enabled; });
    return;
  }
  getPeerConnection()?.getSenders().forEach(s => {
    if (s.track?.kind === 'video') s.track.enabled = enabled;
  });
}

export function getLocalStream(): MediaStream | null {
  return localStream;
}

export function getLocalVideoTracks(): MediaStreamTrack[] {
  return localStream?.getVideoTracks() ?? [];
}

export async function disconnectSIP(): Promise<void> {
  await hangUp();
  await registerer?.unregister().catch(() => {});
  await ua?.stop().catch(() => {});
  ua = null;
  registerer = null;
  activeSession = null;
  callbacks?.onStateChange('disconnected');
}

// ── Helpers ───────────────────────────────────────────────────────

function getPeerConnection(): RTCPeerConnection | null {
  return (activeSession?.sessionDescriptionHandler as any)?.peerConnection ?? null;
}

function attachRemoteAudio(session: Session, audioEl: HTMLAudioElement) {
  const sdh = session.sessionDescriptionHandler as any;
  const stream: MediaStream | undefined = sdh?.remoteMediaStream ?? sdh?.remoteMedia;
  if (stream) {
    audioEl.srcObject = stream;
    audioEl.play().catch(console.error);
    callbacks?.onRemoteStream?.(stream);
  }
}

function attachRemoteVideo(session: Session) {
  const sdh = session.sessionDescriptionHandler as any;
  const stream: MediaStream | undefined = sdh?.remoteMediaStream ?? sdh?.remoteMedia;
  if (stream) callbacks?.onRemoteStream?.(stream);
}

function releaseLocalStream() {
  localStream?.getTracks().forEach(t => t.stop());
  localStream = null;
}
