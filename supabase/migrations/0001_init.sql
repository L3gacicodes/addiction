CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY,
  username text,
  streak_count integer DEFAULT 0,
  iroko_level integer DEFAULT 1,
  onboarding_complete boolean DEFAULT false,
  addiction_type text
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_insert_own ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE TABLE IF NOT EXISTS checkins (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  relapse boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY checkins_select_own ON checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY checkins_insert_own ON checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY checkins_update_own ON checkins FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles(id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
