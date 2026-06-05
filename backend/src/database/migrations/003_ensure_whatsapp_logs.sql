CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  direction    TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  content      TEXT NOT NULL,
  media_type   TEXT,
  processed    BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_user_created
  ON whatsapp_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_direction_created
  ON whatsapp_logs(direction, created_at DESC);
