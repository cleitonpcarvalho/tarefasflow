UPDATE reminders r
SET scheduled_for = (
  SELECT (
    (t.task_date::text || 'T' ||
     COALESCE(t.task_time::text, '08:00:00') ||
     '-03:00'
    )::timestamptz - (r.minutes_before || ' minutes')::interval
  )
  FROM tasks t
  WHERE t.id = r.task_id
)
WHERE r.sent_at IS NULL
  AND r.scheduled_for IS NOT NULL;
