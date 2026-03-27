ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_checkin date,
ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0;
