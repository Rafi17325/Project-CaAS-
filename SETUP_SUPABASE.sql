-- ============================================================
-- VoIP Portal — Supabase Schema (FINAL)
-- Tidak ada tabel voip_users.
-- User divalidasi langsung dari server Kamailio via JSONRPC.
-- Supabase HANYA menyimpan riwayat panggilan.
-- Tidak ada data dummy / demo.
-- ============================================================

-- Hapus tabel lama jika ada
DROP TABLE IF EXISTS call_history;
DROP TABLE IF EXISTS voip_users;

-- Buat tabel call_history
CREATE TABLE call_history (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_phone       text        NOT NULL,
  target_number    text        NOT NULL,
  direction        text        NOT NULL CHECK (direction  IN ('incoming','outgoing','missed')),
  status           text        NOT NULL DEFAULT 'Calling'
                               CHECK (status IN ('Calling','Ringing','In Call','Ended','Missed')),
  call_type        text        NOT NULL DEFAULT 'voice'
                               CHECK (call_type IN ('voice','video')),
  duration_seconds integer     NOT NULL DEFAULT 0,
  started_at       timestamptz NOT NULL DEFAULT now(),
  ended_at         timestamptz
);

-- Index untuk query per-user
CREATE INDEX idx_call_user_time ON call_history (user_phone, started_at DESC);

-- Row Level Security
ALTER TABLE call_history ENABLE ROW LEVEL SECURITY;

-- Policy: izinkan semua operasi (anon key)
CREATE POLICY "allow_all_call_history"
  ON call_history FOR ALL USING (true) WITH CHECK (true);

-- Aktifkan Realtime
-- Di Dashboard: Database → Replication → centang call_history
-- ATAU jalankan query ini:
ALTER PUBLICATION supabase_realtime ADD TABLE call_history;

-- ============================================================
-- CATATAN: Tidak ada INSERT demo/sample.
-- Data hanya masuk dari aktivitas panggilan nyata.
-- ============================================================
