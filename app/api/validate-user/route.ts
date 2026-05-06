/**
 * POST /api/validate-user
 * Validasi nomor telepon langsung ke server Kamailio via JSONRPC.
 * Berjalan server-side (Next.js API Route) — tidak diekspos ke browser.
 */
import { NextRequest, NextResponse } from 'next/server';

const JSONRPC_URL =
  process.env.KAMAILIO_JSONRPC_URL ??
  `http://${process.env.NEXT_PUBLIC_SIP_SERVER ?? '10.98.56.137'}:5080/rpc`;

async function kamRPC(method: string, params: unknown[] = []) {
  const res = await fetch(JSONRPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Kamailio HTTP ${res.status}`);
  const j = await res.json();
  if (j.error) throw new Error(j.error.message ?? 'RPC error');
  return j.result;
}

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json() as { phone: string };
    if (!phone || phone.trim().length < 5) {
      return NextResponse.json({ valid: false, error: 'Format nomor tidak valid' }, { status: 400 });
    }

    const clean  = phone.trim().replace(/\s/g, '');
    const domain = process.env.NEXT_PUBLIC_SIP_SERVER ?? '10.98.56.137';
    const aor    = `sip:${clean}@${domain}`;

    // Strategi 1 — cek user yang sedang online (ul.lookup)
    try {
      const r = await kamRPC('ul.lookup', ['location', aor]);
      if (r) return NextResponse.json({ valid: true, phone: clean, online: true, source: 'ul.lookup' });
    } catch { /* tidak ada / offline */ }

    // Strategi 2 — cek semua user di DB Kamailio (ul.db_users)
    try {
      const r = await kamRPC('ul.db_users', ['location']);
      if (r) {
        const list: string[] = Array.isArray(r)
          ? r
          : (Object.values(r) as string[][]).flat();
        const found = list.some(e => e.replace(/^sip:|@.*/gi, '').trim() === clean);
        if (found) return NextResponse.json({ valid: true, phone: clean, online: false, source: 'ul.db_users' });
      }
    } catch { /* modul tidak ada */ }

    // Strategi 3 — cek tabel subscriber via db RPC
    try {
      const r = await kamRPC('db.query', [
        'subscriber', ['username'], [`username='${clean}'`],
      ]);
      if (r && (Array.isArray(r) ? r.length > 0 : true)) {
        return NextResponse.json({ valid: true, phone: clean, online: false, source: 'subscriber' });
      }
    } catch { /* tidak tersedia */ }

    return NextResponse.json({
      valid: false,
      error: 'Nomor tidak terdaftar di server VoIP Kamailio',
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const unreachable = /ECONNREFUSED|timeout|fetch|TimeoutError/i.test(msg);
    return NextResponse.json({
      valid: false,
      error: unreachable
        ? 'Server Kamailio tidak dapat dihubungi. Pastikan server aktif dan port 5080 terbuka.'
        : msg,
      server_unreachable: unreachable,
    }, { status: unreachable ? 503 : 500 });
  }
}
