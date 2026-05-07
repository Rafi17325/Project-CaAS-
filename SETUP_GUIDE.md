# 🛠️ Setup Guide — VoIP Portal (Revisi)

## ✅ Apa yang Berubah dari Versi Sebelumnya

| File / Folder | Status | Keterangan |
|---|---|---|
| `next.config.mjs` | **DIPERBARUI** | Tambah `eslint.ignoreDuringBuilds: true`, fix webpack |
| `next.config.ts` | **DIHAPUS** | ❌ Konflik dengan next.config.mjs |
| `eslint.config.mjs` | **DIHAPUS** | ❌ ESLint v9 flat config tidak kompatibel dengan eslint@8 |
| `.eslintrc.json` | **BARU** | ✅ Format ESLint v8 yang benar |
| `postcss.config.mjs` | **DIHAPUS** | ❌ Konflik dengan postcss.config.js |
| `postcss.config.js` | **DIPERTAHANKAN** | ✅ Format Tailwind v3 yang benar |
| `tailwind.config.ts` | **DIPERBARUI** | Fix content paths ke `src/` |
| `src/app/globals.css` | **DIPERBARUI** | ✅ Ganti `@import "tailwindcss"` → `@tailwind` directives (v3) |
| `src/app/page.tsx` | **DIPERBARUI** | ✅ Redirect ke `/login` |
| `src/app/layout.tsx` | **DIPERBARUI** | Fix metadata & background |
| `src/app/login/page.tsx` | **BARU** | ✅ Halaman login dengan nomor telepon |
| `src/app/dashboard/page.tsx` | **BARU** | ✅ Dashboard utama VoIP |
| `src/app/api/validate-user/route.ts` | **BARU** | 🔴 Backend API: validasi user via Kamailio JSONRPC |
| `src/components/Dialer.tsx` | **BARU** | ✅ Komponen keypad telepon |
| `src/components/CallLogTable.tsx` | **BARU** | ✅ Tabel riwayat panggilan + realtime |
| `src/components/SipStatus.tsx` | **BARU** | ✅ Indikator status koneksi SIP |
| `src/hooks/useSip.tsx` | **BARU** | ✅ Hook SIP.js: register, call, hangup, mute |
| `src/lib/supabase.ts` | **BARU** | 🔵 Supabase client + helper saveCallHistory |
| `src/lib/sip-config.ts` | **BARU** | 🔵 Helper konfigurasi SIP dari env vars |
| `types/voip.ts` | **DIPERBARUI** | ✅ Tambah VoipContextType, ValidateUserResponse |
| `.env.local.example` | **BARU** | Template env vars (tanpa nilai sensitif) |

---

## 🗂️ Struktur Folder (Frontend vs Backend)

```
cps_projectfinal/
├── src/
│   ├── app/
│   │   ├── api/                          ← 🔴 BACKEND (Next.js API Routes)
│   │   │   └── validate-user/
│   │   │       └── route.ts              ← Validasi user ke Kamailio JSONRPC
│   │   │
│   │   ├── login/                        ← 🟢 FRONTEND (Halaman Login)
│   │   │   └── page.tsx
│   │   ├── dashboard/                    ← 🟢 FRONTEND (Halaman Utama)
│   │   │   └── page.tsx
│   │   ├── layout.tsx                    ← Root layout
│   │   ├── globals.css
│   │   └── page.tsx                      ← Redirect → /login
│   │
│   ├── components/                       ← 🟢 FRONTEND (UI Components)
│   │   ├── Dialer.tsx                    ← Keypad + tombol call/hangup/mute
│   │   ├── CallLogTable.tsx              ← Tabel riwayat + realtime Supabase
│   │   └── SipStatus.tsx                ← Indikator status SIP
│   │
│   ├── hooks/                            ← 🟢 FRONTEND (Custom Hooks)
│   │   └── useSip.tsx                   ← Semua logika SIP.js
│   │
│   └── lib/                             ← 🔵 SHARED (Utilities)
│       ├── supabase.ts                  ← Supabase client + saveCallHistory
│       └── sip-config.ts               ← Helper config SIP dari env vars
│
├── types/
│   └── voip.ts                          ← TypeScript types (shared)
│
├── .env.local.example                   ← Template env (copy ke .env.local)
├── .eslintrc.json                       ← ESLint v8 config (BARU)
├── next.config.mjs                      ← Next.js config (satu file saja)
├── postcss.config.js                    ← PostCSS Tailwind v3 (satu file saja)
├── tailwind.config.ts
├── package.json
├── tsconfig.json
└── vercel.json
```

---

## 📋 Langkah Deploy

### 1. Copy file yang berubah ke project GitHub kamu

Ganti/tambahkan file-file berikut di repo GitHub (Rafi17325/Project-CaAS-):

**Hapus file ini:**
- `next.config.ts`
- `eslint.config.mjs`
- `postcss.config.mjs`

**Tambah/ganti file ini:**
- Semua file di folder `src/`
- `next.config.mjs`
- `.eslintrc.json`
- `postcss.config.js`
- `tailwind.config.ts`
- `tsconfig.json`
- `types/voip.ts`
- `package.json`

### 2. Setup Environment Variables di Vercel

Di Vercel Dashboard → Settings → Environment Variables, tambahkan:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase kamu |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key Supabase |
| `NEXT_PUBLIC_SIP_SERVER` | IP server Kamailio (e.g. `10.98.56.137`) |
| `NEXT_PUBLIC_SIP_PORT` | `5060` |
| `NEXT_PUBLIC_WEBSOCKET_URL` | `ws://IP_SERVER/ws` |
| `NEXT_PUBLIC_SIP_DEFAULT_PASSWORD` | (kosong = gunakan nomor HP sebagai password) |
| `KAMAILIO_JSONRPC_URL` | `http://IP_SERVER:5080/rpc` |

> ⚠️ **Catatan:** Vercel cloud tidak bisa akses IP lokal `10.98.56.137`.
> Gunakan IP publik server Kamailio, atau gunakan **ngrok** untuk expose:
> ```bash
> ngrok http 5080    # untuk JSONRPC
> ngrok tcp 8080     # untuk WebSocket
> ```

### 3. Setup Supabase

Jalankan `SETUP_SUPABASE.sql` di Supabase SQL Editor, lalu aktifkan Realtime
untuk tabel `call_history` di Dashboard → Database → Replication.

### 4. Push & Deploy

```bash
git add .
git commit -m "fix: resolve build errors, restructure frontend/backend"
git push origin main
```

Vercel akan otomatis deploy ulang setelah push.

---

## 🐛 Root Cause Build Error (Penjelasan)

Build error "npm run build exited with 1" disebabkan oleh **4 konflik sekaligus**:

1. **`next.config.mjs` + `next.config.ts`** → Next.js tidak bisa handle dua config
2. **`postcss.config.js` + `postcss.config.mjs`** → PostCSS konflik dua format
3. **`eslint.config.mjs`** pakai API ESLint v9 (`defineConfig`, `globalIgnores` dari `"eslint/config"`) tapi `eslint@8` terinstall → ESLint crash saat build
4. **`globals.css`** pakai `@import "tailwindcss"` dan `@theme inline` (Tailwind v4 syntax) tapi `tailwindcss@3` terinstall → CSS tidak di-compile
