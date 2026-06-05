ALTER TABLE users
  ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_users_whatsapp_phone
  ON users(whatsapp_phone)
  WHERE whatsapp_phone IS NOT NULL;
