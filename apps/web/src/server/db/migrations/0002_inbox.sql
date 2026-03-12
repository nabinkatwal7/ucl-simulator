PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS inbox_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  career_id INTEGER NOT NULL,
  sent_on INTEGER NOT NULL,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read INTEGER NOT NULL,
  action_payload_json TEXT,
  FOREIGN KEY (career_id) REFERENCES careers(id)
);

CREATE INDEX IF NOT EXISTS idx_inbox_messages_career ON inbox_messages(career_id, sent_on);