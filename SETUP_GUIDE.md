# 🛠️ Setup Guide — VoIP Portal

## File yang Berubah / Harus Diganti

```
cps_projectfinal/
├── app/
│   ├── (auth)/login/page.tsx          ← GANTI (phone only, Kamailio auth)
│   └── api/
│       └── validate-user/
│           └── route.ts               ← BARU (Kamailio JSONRPC validation)
├── components/voip/
│   ├── DialPad.tsx                    ← GANTI (real camera, mute, video stream)
│   └── CallLogTable.tsx               ← GANTI (kolom call_type, realtime)
├── lib/
│   ├── sipClient.ts                   ← GANTI (Nginx proxy, real stream)
│   ├── voipProvider.tsx               ← GANTI (Supabase tracking, camera)
│   └── supabase.ts                    ← GANTI (call_history only, no voip_users)
├── nginx/
│   └── voip-portal.conf               ← BARU (konfigurasi Nginx)
├── SETUP_SUPABASE.sql                 ← BARU (schema bersih)
├── .env.local                         ← UPDATE (tambah KAMAILIO_JSONRPC_URL)
└── vercel.json                        ← UPDATE
```

---

## BAGIAN 1 — Supabase

### 1.1 Jalankan SQL Schema
Di Supabase Dashboard → **SQL Editor** → paste isi `SETUP_SUPABASE.sql` → Run

> Ini akan DROP tabel lama dan buat ulang `call_history` yang bersih.

### 1.2 Aktifkan Realtime
- Supabase Dashboard → **Database** → **Replication**
- Centang tabel `call_history` → Save

---

## BAGIAN 2 — Server Kamailio

### 2.1 Modul yang harus aktif di kamailio.cfg

```cfg
loadmodule "xhttp.so"
loadmodule "websocket.so"
loadmodule "jsonrpcs.so"

# UDP untuk SIP internal
listen = udp:0.0.0.0:5060

# WebSocket (akan diproxy oleh Nginx di port 8080)
listen = tcp:0.0.0.0:8080

# JSONRPC HTTP (diakses server-side oleh Next.js)
listen = tcp:0.0.0.0:5080
```

### 2.2 WebSocket keepalive
```cfg
modparam("websocket", "keepalive_mechanism", 1)
modparam("websocket", "keepalive_timeout", 30)
```

### 2.3 Route WebSocket + JSONRPC
```cfg
event_route[xhttp:request] {
    set_reply_close();
    set_reply_no_connect();
    if (path_info == "/rpc" || path_info =~ "^/rpc") {
        jsonrpc_dispatch();
        return;
    }
    if (ws_handle_handshake()) return;
    xhttp_reply("404","Not Found","","");
}
```

### 2.4 Daftarkan user (via kamctl)
```bash
# Tambah user baru ke subscriber table
kamctl add 08121234567@10.98.56.137 passwordku
kamctl add 08129876543@10.98.56.137 passwordnya

# Verifikasi
kamctl db show subscriber
```

### 2.5 Tes JSONRPC
```bash
curl -s -X POST http://localhost:5080/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"core.version","params":[],"id":1}'
```

---

## BAGIAN 3 — Nginx

### 3.1 Pasang Nginx
```bash
sudo apt update && sudo apt install nginx -y
```

### 3.2 Copy konfigurasi
```bash
sudo cp nginx/voip-portal.conf /etc/nginx/sites-available/voip-portal
sudo ln -s /etc/nginx/sites-available/voip-portal /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 3.3 Firewall
```bash
sudo ufw allow 80/tcp        # Nginx HTTP
sudo ufw allow 5060/udp      # SIP UDP (internal Kamailio)
sudo ufw allow 8080/tcp      # Kamailio WebSocket (lokal)
sudo ufw allow 5080/tcp      # Kamailio JSONRPC (lokal/server only)
```

### 3.4 Alur koneksi setelah Nginx aktif
```
Browser → ws://10.98.56.137/ws → Nginx → Kamailio :8080 → SIP/UDP :5060
Next.js API → http://localhost:5080/rpc → Kamailio JSONRPC
```

---

## BAGIAN 4 — Deploy ke Vercel (GitHub)

### 4.1 Push ke GitHub
```bash
cd cps_projectfinal
git init
git remote add origin https://github.com/Rafi17325/Project-CaAS-.git
git add .
git commit -m "VoIP Portal - Kamailio + Nginx + Supabase"
git branch -M main
git push -u origin main
```

### 4.2 Import di Vercel
1. Buka https://vercel.com
2. **Add New Project** → Import from GitHub → pilih **Project-CaAS-**
3. Framework: **Next.js** (otomatis)
4. **Environment Variables** → tambahkan semua:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://tkedfdffmktefxedlkyi.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (dari .env.local) |
| `NEXT_PUBLIC_SIP_SERVER` | `10.98.56.137` |
| `NEXT_PUBLIC_WEBSOCKET_URL` | `ws://10.98.56.137/ws` |
| `NEXT_PUBLIC_SIP_DEFAULT_PASSWORD` | *(kosong atau password SIP)* |
| `KAMAILIO_JSONRPC_URL` | `http://10.98.56.137:5080/rpc` |
| `KAMAILIO_RPC_USER` | *(kosong)* |
| `KAMAILIO_RPC_PASS` | *(kosong)* |

5. **Deploy** → selesai, URL Vercel langsung aktif global.

> ⚠️ **Catatan penting untuk Vercel + Kamailio lokal:**
> Vercel berjalan di cloud, tidak bisa akses IP lokal `10.98.56.137`.
> Pastikan server Kamailio punya **IP publik** atau gunakan **ngrok**:
> ```bash
> ngrok http 5080    # expose JSONRPC
> ngrok tcp 8080     # expose WebSocket
> # Update env KAMAILIO_JSONRPC_URL dan NEXT_PUBLIC_WEBSOCKET_URL dengan URL ngrok
> ```

---

## Ringkasan Perubahan dari Versi Sebelumnya

| Komponen | Sebelum | Sesudah |
|----------|---------|---------|
| Login | Query `voip_users` Supabase | Kamailio JSONRPC `/api/validate-user` |
| Data user | Tabel Supabase (manual) | Langsung dari server Kamailio |
| Demo data | Ada | **Tidak ada sama sekali** |
| sipClient | WebSocket langsung ke Kamailio | **Via Nginx proxy `/ws`** |
| Video call | Placeholder stream | **Kamera device nyala (getUserMedia)** |
| Camera toggle | Hanya state UI | **Track hardware enable/disable** |
| Mute | Via PeerConnection | **Via localStream track langsung** |
| Supabase | `voip_users` + `call_history` | **Hanya `call_history`** |
| Durasi call | Hardcoded 0 | **Dihitung real dari start–end** |
| Call type | Tidak tampil di tabel | **Kolom Voice/Video di call log** |
