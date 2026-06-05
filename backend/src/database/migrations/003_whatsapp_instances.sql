CREATE TABLE IF NOT EXISTS whatsapp_instances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instance_name   TEXT NOT NULL UNIQUE,
  instance_token  TEXT,
  status          TEXT NOT NULL DEFAULT 'created'
                  CHECK (status IN ('created','connecting','open','close')),
  phone_number    TEXT,
  webhook_set     BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_whatsapp_instances_updated'
  ) THEN
    CREATE TRIGGER trg_whatsapp_instances_updated
      BEFORE UPDATE ON whatsapp_instances
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_user
  ON whatsapp_instances(user_id);
