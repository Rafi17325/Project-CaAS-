
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

export interface SipCallbacks {
  onStateChange: (state: SipState) => void;
  onCallStateChange: (state: SessionState, direction: CallDirection) => void;
  onIncomingCall: (session: Invitation, callerNumber: string) => void;
}

let callbacks: SipCallbacks | null = null;

export function setSipCallbacks(cb: SipCallbacks) {
  callbacks = cb;
}

export async function connectSIP(phone: string): Promise<void> {
  const sipServer  = process.env.NEXT_PUBLIC_SIP_SERVER   ?? '10.98.56.198';
  const wsURL      = process.env.NEXT_PUBLIC_WEBSOCKET_URL ?? `ws://${sipServer}:8080`;
  // If Kamailio uses phone = password, set env NEXT_PUBLIC_SIP_DEFAULT_PASSWORD=phone
  // Otherwise override with the actual domain password
  const sipPassword = process.env.NEXT_PUBLIC_SIP_DEFAULT_PASSWORD ?? phone;

  callbacks?.onStateChange('connecting');

  const options: UserAgentOptions = {
    uri: UserAgent.makeURI(`sip:${phone}@${sipServer}`),
    transportOptions: { server: wsURL },
    authorizationUsername: phone,
    authorizationPassword: sipPassword,
    sessionDescriptionHandlerFactoryOptions: {
      constraints: { audio: true, video: false },
    },
    delegate: {
      onInvite: (invitation: Invitation) => {
        const callerURI = invitation.remoteIdentity.uri.toString();
        const callerNumber = callerURI.replace(/sip:|@.*/g, '');
        callbacks?.onIncomingCall(invitation, callerNumber);
      },
    },
  };

  ua = new UserAgent(options);
  await ua.start();

  registerer = new Registerer(ua);
  registerer.stateChange.addListener((state: RegistererState) => {
    switch (state) {
      case RegistererState.Registered:
        callbacks?.onStateChange('registered');
        break;
      case RegistererState.Unregistered:
        callbacks?.onStateChange('disconnected');
        break;
    }
  });

  await registerer.register();
}

/** Voice call */
export async function makeCall(
  target: string,
  remoteAudioRef: HTMLAudioElement
): Promise<Session> {
  if (!ua) throw new Error('SIP belum terhubung');
  const sipServer = process.env.NEXT_PUBLIC_SIP_SERVER ?? '10.98.56.198';
  const targetURI = UserAgent.makeURI(`sip:${target}@${sipServer}`);
  if (!targetURI) throw new Error('Nomor tujuan tidak valid');

  const inviter = new Inviter(ua, targetURI, {
    sessionDescriptionHandlerOptions: {
      constraints: { audio: true, video: false },
    },
  });

  inviter.stateChange.addListener((state: SessionState) => {
    callbacks?.onCallStateChange(state, 'outgoing');
    if (state === SessionState.Established) {
      attachAudio(inviter, remoteAudioRef);
    }
  });

  await inviter.invite();
  activeSession = inviter;
  return inviter;
}

/** Video call */
export async function makeVideoCall(
  target: string,
  remoteAudioRef: HTMLAudioElement
): Promise<Session> {
  if (!ua) throw new Error('SIP belum terhubung');
  const sipServer = process.env.NEXT_PUBLIC_SIP_SERVER ?? '10.98.56.198';
  const targetURI = UserAgent.makeURI(`sip:${target}@${sipServer}`);
  if (!targetURI) throw new Error('Nomor tujuan tidak valid');

  const inviter = new Inviter(ua, targetURI, {
    sessionDescriptionHandlerOptions: {
      constraints: { audio: true, video: true },
    },
  });

  inviter.stateChange.addListener((state: SessionState) => {
    callbacks?.onCallStateChange(state, 'outgoing');
    if (state === SessionState.Established) {
      attachAudio(inviter, remoteAudioRef);
    }
  });

  await inviter.invite();
  activeSession = inviter;
  return inviter;
}

/** Accept incoming call */
export async function acceptCall(
  invitation: Invitation,
  remoteAudioRef: HTMLAudioElement
): Promise<void> {
  await invitation.accept({
    sessionDescriptionHandlerOptions: {
      constraints: { audio: true, video: false },
    },
  });
  activeSession = invitation;

  invitation.stateChange.addListener((state: SessionState) => {
    callbacks?.onCallStateChange(state, 'incoming');
    if (state === SessionState.Established) {
      attachAudio(invitation, remoteAudioRef);
    }
  });
}

export async function rejectCall(invitation: Invitation): Promise<void> {
  await invitation.reject();
}

export async function hangUp(): Promise<void> {
  if (!activeSession) return;
  if (activeSession.state === SessionState.Established) {
    await (activeSession as Inviter).bye();
  } else {
    await (activeSession as Inviter).cancel?.();
  }
  activeSession = null;
}

export function setMute(muted: boolean): void {
  const pc = getPeerConnection();
  if (!pc) return;
  pc.getSenders().forEach(sender => {
    if (sender.track?.kind === 'audio') sender.track.enabled = !muted;
  });
}

export function sendDTMF(tone: string): void {
  activeSession?.sessionDescriptionHandler
    // @ts-ignore
    ?.sendDtmf(tone);
}

/** Helper — get local video tracks for camera toggle */
export function getLocalVideoTracks(): MediaStreamTrack[] {
  const pc = getPeerConnection();
  if (!pc) return [];
  return pc.getSenders()
    .filter(s => s.track?.kind === 'video')
    .map(s => s.track as MediaStreamTrack);
}

export async function disconnectSIP(): Promise<void> {
  await hangUp();
  await registerer?.unregister();
  await ua?.stop();
  ua = null;
  registerer = null;
  activeSession = null;
  callbacks?.onStateChange('disconnected');
}

// ── Internal helpers ──────────────────────────────────────────────

function getPeerConnection(): RTCPeerConnection | null {
  return (activeSession?.sessionDescriptionHandler as any)?.peerConnection ?? null;
}

function attachAudio(session: Session, audioEl: HTMLAudioElement) {
  const sdh = session.sessionDescriptionHandler as any;
  const remoteStream = sdh?.remoteMediaStream;
  if (remoteStream && audioEl) {
    audioEl.srcObject = remoteStream;
    audioEl.play().catch(console.error);
  }
}
