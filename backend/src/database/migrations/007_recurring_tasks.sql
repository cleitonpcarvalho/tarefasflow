ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS rrule TEXT,
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS recurrence_end DATE,
  ADD COLUMN IF NOT EXISTS excluded_dates TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN tasks.rrule IS
  'Regra de recorrência no padrão iCalendar RRULE. Ex: FREQ=WEEKLY;BYDAY=TU,TH';
COMMENT ON COLUMN tasks.parent_id IS
  'ID da tarefa pai (template). Ocorrências geradas apontam para o pai.';
COMMENT ON COLUMN tasks.recurrence_end IS
  'Data final da recorrência. NULL = sem fim definido.';
COMMENT ON COLUMN tasks.excluded_dates IS
  'Datas removidas individualmente da série recorrente no formato YYYY-MM-DD.';

CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id)
  WHERE parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_recurring_range
  ON tasks(user_id, task_date, recurrence_end)
  WHERE is_recurring = true AND parent_id IS NULL;
