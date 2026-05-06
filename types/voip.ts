export type CallType = 'Voice' | 'Video';
export type CallTypeCall = 'received' | 'outgoing' | 'missed';
export type CallStatus = 'Calling' | 'Ringing' | 'In Call' | 'Call Ended' | 'Ended' | 'Missed';

export interface CallLog {
  id: string;
  type: CallType;
  time: string;
  date: string;
  status: string;
  type_call: CallTypeCall;
  duration: string; // format MM:SS
  target: string;   // nomor tujuan
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
  isConnected: boolean;
  currentCall: CallLog | null;
  makeCall: (target: string) => void;
  hangUp: () => void;
}
