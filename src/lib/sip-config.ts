// ============================================================
// 🔵 LIB/SHARED — SIP Configuration Helper
// Membaca env vars dan menghasilkan SipConfig object
// ============================================================
import type { SipConfig } from '../../types/voip';

export function getSipConfig(username: string, password?: string): SipConfig {
  const server = process.env.NEXT_PUBLIC_SIP_SERVER ?? '';
  const port = parseInt(process.env.NEXT_PUBLIC_SIP_PORT ?? '5060', 10);
  const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL ?? `ws://${server}/ws`;
  const defaultPassword = process.env.NEXT_PUBLIC_SIP_DEFAULT_PASSWORD ?? username;

  return {
    server,
    port,
    transport: 'WS',
    websocketUrl,
    username,
    password: password ?? defaultPassword,
  };
}

// Format SIP URI: sip:08121234567@10.98.56.137
export function toSipUri(username: string, server?: string): string {
  const sipServer = server ?? process.env.NEXT_PUBLIC_SIP_SERVER ?? '';
  return `sip:${username}@${sipServer}`;
}
