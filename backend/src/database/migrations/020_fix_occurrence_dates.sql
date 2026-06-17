UPDATE reminders r
SET occurrence_date = t.task_date
FROM tasks t
WHERE r.task_id = t.id
  AND t.rrule IS NOT NULL
  AND r.occurrence_date IS NULL;
