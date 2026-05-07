// ============================================================
// SHARED TYPES — digunakan oleh frontend & backend
// ============================================================

export type CallType = 'Voice' | 'Video';
export type CallTypeCall = 'received' | 'outgoing' | 'missed';
export type CallStatus =
  | 'Calling'
  | 'Ringing'
  | 'In Call'
  | 'Call Ended'
  | 'Ended'
  | 'Missed';

export interface CallLog {
  id: string;
  type: CallType;
  time: string;         // HH:MM
  date: string;         // YYYY-MM-DD
  status: CallStatus;
  type_call: CallTypeCall;
  duration: string;     // format MM:SS
  target: string;       // nomor tujuan (e.g. 08121234567)
}

export interface SipConfig {
  server: string;
  port: number;
  transport: 'UDP' | 'TCP' | 'WS' | 'WSS';
  websocketUrl: string;
  username: string;
  password: string;
}

export interface VoipContextType {
  isRegistered: boolean;
  callStatus: CallStatus | null;
  currentTarget: string | null;
  callDuration: number;         // detik
  makeCall: (target: string) => void;
  hangUp: () => void;
  isMuted: boolean;
  toggleMute: () => void;
}

// Response dari /api/validate-user
export interface ValidateUserResponse {
  valid: boolean;
  username?: string;
  message?: string;
}
