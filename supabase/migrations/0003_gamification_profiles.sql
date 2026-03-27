ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username text,
ADD COLUMN IF NOT EXISTS streak_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_checkin date,
ADD COLUMN IF NOT EXISTS iroko_stage text DEFAULT 'Seed',
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

COMMENT ON COLUMN profiles.iroko_stage IS 'Textual stage name: Seed, Sprout, Sapling, Young Tree, Mature Iroko';
