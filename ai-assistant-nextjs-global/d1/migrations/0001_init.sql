-- Production schema for the assistant (ported from server.py init_db()).
-- Apply with: pnpm exec cf d1 execute ai-assistant --dir=d1/migrations

CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  user_role TEXT,
  message_text TEXT,
  message_type TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logged_shots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT,
  student_level TEXT,
  preset_id TEXT,
  description_json TEXT,
  shot_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  source TEXT DEFAULT 'preset',
  production TEXT,
  frame_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_logged_shots_student
  ON logged_shots (student_id, student_level, production);
