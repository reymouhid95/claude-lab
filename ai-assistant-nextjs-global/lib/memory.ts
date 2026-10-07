/**
 * Session memory in D1, ported from the Flask `SQLiteSession` +
 * `conversations` inserts: the same table, the same session key
 * `${studentId}-${studentLevel}`.
 */
import type { Content } from "./gemini";

/** Minimal shape of the D1 binding used here (types are generated later). */
export type Db = {
  prepare(query: string): {
    bind(...values: unknown[]): {
      all<T>(): Promise<{ results: T[] }>;
      run(): Promise<unknown>;
    };
    run(): Promise<unknown>;
  };
  batch(statements: { run(): Promise<unknown> }[]): Promise<unknown>;
};

/** Keep the prompt small: the last N messages are enough for continuity. */
const HISTORY_LIMIT = 12;

/**
 * Idempotent schema, mirroring the Flask `init_db()`: the tables are created
 * on first use so a fresh local database works without a migration step (in
 * production the D1 migration is applied separately; this is a no-op there).
 */
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    user_role TEXT,
    message_text TEXT,
    message_type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS logged_shots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT,
    student_level TEXT,
    preset_id TEXT,
    description_json TEXT,
    shot_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source TEXT DEFAULT 'preset',
    production TEXT,
    frame_id TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_logged_shots_student
    ON logged_shots (student_id, student_level, production)`,
];

let schemaReady = false;

export async function ensureSchema(db: Db): Promise<void> {
  if (schemaReady) return;
  await Promise.all(SCHEMA.map((sql) => db.prepare(sql).run()));
  schemaReady = true;
}

export function sessionKey(studentId: string, level: string): string {
  return `${studentId}-${level}`;
}

export async function loadHistory(db: Db, sessionId: string): Promise<Content[]> {
  try {
    await ensureSchema(db);
    const { results } = await db
      .prepare(
        "SELECT user_role, message_text FROM conversations "
        + "WHERE session_id = ? ORDER BY id DESC LIMIT ?",
      )
      .bind(sessionId, HISTORY_LIMIT)
      .all<{ user_role: string; message_text: string }>();

    return results
      .reverse()
      .filter((row) => row.message_text)
      .map((row) => ({
        role: row.user_role === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: row.message_text }],
      }));
  } catch {
    // A cold or empty database must never block the conversation.
    return [];
  }
}

export async function saveExchange(
  db: Db,
  sessionId: string,
  userMessage: string,
  assistantMessage: string,
): Promise<void> {
  const insert = (role: string, type: string, text: string) =>
    db
      .prepare(
        "INSERT INTO conversations (session_id, user_role, message_text, message_type) "
        + "VALUES (?, ?, ?, ?)",
      )
      .bind(sessionId, role, text, type);

  try {
    await ensureSchema(db);
    await db.batch([
      insert("user", "question", userMessage),
      insert("assistant", "response", assistantMessage),
    ]);
  } catch {
    // History is a convenience, not a requirement.
  }
}
