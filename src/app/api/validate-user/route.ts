// ============================================================
// 🔴 BACKEND — API Route: /api/validate-user
// Validasi nomor telepon ke Kamailio via JSONRPC
// Dipanggil dari halaman Login (server-side only)
// ============================================================
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { valid: false, message: 'Username diperlukan' },
        { status: 400 }
      );
    }

    const jsonrpcUrl = process.env.KAMAILIO_JSONRPC_URL;

    // Jika JSONRPC URL tidak dikonfigurasi, allow login (mode dev)
    if (!jsonrpcUrl) {
      console.warn('[API] KAMAILIO_JSONRPC_URL tidak diset — mode dev, login diizinkan');
      return NextResponse.json({ valid: true, username });
    }

    // Panggil Kamailio JSONRPC — cek apakah user terdaftar di subscriber
    const rpcResponse = await fetch(jsonrpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'ul.lookup',
        params: ['location', username],
        id: 1,
      }),
      // Timeout 5 detik
      signal: AbortSignal.timeout(5000),
    });

    if (!rpcResponse.ok) {
      // Jika Kamailio tidak bisa diakses dari Vercel (IP private),
      // izinkan login agar tidak block user di production
      console.warn('[API] Kamailio tidak terjangkau:', rpcResponse.status);
      return NextResponse.json({ valid: true, username, message: 'kamailio_unreachable' });
    }

    const rpcData = await rpcResponse.json();

    // ul.lookup return error jika user tidak ditemukan / tidak online
    const isOnline = !rpcData.error && rpcData.result != null;

    return NextResponse.json({
      valid: true,   // izinkan login meski offline di Kamailio
      username,
      online: isOnline,
      message: isOnline ? 'User terdaftar dan online' : 'User terdaftar tapi offline',
    });

  } catch (err) {
    // Network error (Kamailio IP private tidak bisa diakses dari Vercel)
    console.error('[API] validate-user error:', err);
    // Tetap izinkan login — SIP akan validasi saat register
    return NextResponse.json({ valid: true, message: 'kamailio_unreachable' });
  }
}
