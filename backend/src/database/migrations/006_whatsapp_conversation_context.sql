ALTER TABLE whatsapp_logs
  ADD COLUMN IF NOT EXISTS phone TEXT;

CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_conversation_created
  ON whatsapp_logs(user_id, phone, created_at DESC)
  WHERE phone IS NOT NULL;
