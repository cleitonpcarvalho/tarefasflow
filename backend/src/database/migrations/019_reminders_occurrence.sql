-- Adiciona occurrence_date para identificar a ocorrência específica
ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS occurrence_date DATE;

-- Constraint única para evitar duplicatas por ocorrência
ALTER TABLE reminders
  ADD CONSTRAINT reminders_task_occurrence_unique
  UNIQUE (task_id, user_id, minutes_before, occurrence_date)
  DEFERRABLE INITIALLY DEFERRED;
