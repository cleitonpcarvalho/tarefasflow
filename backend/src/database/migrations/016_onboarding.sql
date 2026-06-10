ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;
UPDATE users SET onboarding_completed = true WHERE onboarding_completed = false;
