CREATE TABLE IF NOT EXISTS onboarding_followup_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_sequence INTEGER NOT NULL,
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, day_sequence)
);
