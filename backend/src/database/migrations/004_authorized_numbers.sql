CREATE TABLE IF NOT EXISTS authorized_numbers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     UUID NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone           TEXT NOT NULL,
  label           TEXT,
  can_create_task BOOLEAN NOT NULL DEFAULT true,
  can_read_tasks  BOOLEAN NOT NULL DEFAULT true,
  can_delete_task BOOLEAN NOT NULL DEFAULT false,
  can_add_reminder BOOLEAN NOT NULL DEFAULT true,
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(instance_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_authorized_numbers_instance
  ON authorized_numbers(instance_id, phone);
