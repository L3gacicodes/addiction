CREATE TABLE IF NOT EXISTS journal_entries (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled',
  content text NOT NULL,
  mood text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY journal_entries_select_own ON journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY journal_entries_insert_own ON journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY journal_entries_update_own ON journal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY journal_entries_delete_own ON journal_entries FOR DELETE USING (auth.uid() = user_id);
