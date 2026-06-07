ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reminder_defaults INTEGER[] DEFAULT '{}';

COMMENT ON COLUMN users.reminder_defaults IS
  'Array de minutos antes para lembretes padrão. Ex: {30, 1440} = 30min e 1 dia antes';
