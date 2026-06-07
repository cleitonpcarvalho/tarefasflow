ALTER TABLE users
  ADD COLUMN IF NOT EXISTS daily_summary_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS daily_summary_time TEXT DEFAULT '06:00';

COMMENT ON COLUMN users.daily_summary_enabled IS
  'Se true, usuario recebe resumo diario de tarefas via WhatsApp';
COMMENT ON COLUMN users.daily_summary_time IS
  'Horario do resumo diario no formato HH:MM, fuso America/Fortaleza';
