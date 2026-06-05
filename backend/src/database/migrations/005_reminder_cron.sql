ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pending_send  BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION mark_pending_reminders()
RETURNS void AS $$
BEGIN
  UPDATE reminders r
  SET pending_send = true
  FROM tasks t
  WHERE r.task_id = t.id
    AND r.sent_at IS NULL
    AND r.pending_send = false
    AND r.scheduled_for IS NOT NULL
    AND r.scheduled_for <= NOW();
END;
$$ LANGUAGE plpgsql;

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'mark-pending-reminders',
  '* * * * *',
  'SELECT mark_pending_reminders()'
);
