CREATE TABLE IF NOT EXISTS email_verification_codes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  code       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('signup','reset_password')),
  used       BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_evc_email_type
  ON email_verification_codes(email, type);
ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON email_verification_codes
  TO service_role USING (true) WITH CHECK (true);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;

-- Usuários existentes já são considerados verificados
UPDATE users SET email_verified = true WHERE email_verified = false;
