CREATE TABLE IF NOT EXISTS special_dates (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                  TEXT        NOT NULL,
  month                 INTEGER     NOT NULL CHECK (month BETWEEN 1 AND 12),
  day                   INTEGER     NOT NULL CHECK (day BETWEEN 1 AND 31),
  is_national           BOOLEAN     NOT NULL DEFAULT false,
  active                BOOLEAN     NOT NULL DEFAULT true,
  notify_on_day         BOOLEAN     NOT NULL DEFAULT true,
  notify_1_day_before   BOOLEAN     NOT NULL DEFAULT false,
  notify_1_week_before  BOOLEAN     NOT NULL DEFAULT false,
  notify_1_month_before BOOLEAN     NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_special_dates_updated
  BEFORE UPDATE ON special_dates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_special_dates_user
  ON special_dates(user_id);

CREATE INDEX IF NOT EXISTS idx_special_dates_month_day
  ON special_dates(month, day);

ALTER TABLE special_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON special_dates
  TO service_role USING (true) WITH CHECK (true);
