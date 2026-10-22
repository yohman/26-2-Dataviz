CREATE TABLE IF NOT EXISTS submissions (
  image_index INTEGER PRIMARY KEY AUTOINCREMENT,
  week INTEGER NOT NULL CHECK(week BETWEEN 1 AND 14),
  student_key TEXT NOT NULL,
  browser_id TEXT,
  revision_hash TEXT,
  public_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(week, student_key)
);
CREATE INDEX IF NOT EXISTS submissions_week ON submissions(week, image_index);
CREATE TABLE IF NOT EXISTS submission_revisions (
  request_id TEXT PRIMARY KEY,
  image_index INTEGER NOT NULL,
  browser_id TEXT,
  private_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS image_chunks (
  image_key TEXT NOT NULL,
  part INTEGER NOT NULL,
  mime TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY(image_key, part)
);
CREATE TABLE IF NOT EXISTS source_archive (
  source TEXT NOT NULL,
  row_number INTEGER NOT NULL,
  private_json TEXT NOT NULL,
  PRIMARY KEY(source, row_number)
);
CREATE TABLE IF NOT EXISTS week_schedule (
  week INTEGER PRIMARY KEY,
  challenge TEXT NOT NULL,
  opens_ms INTEGER NOT NULL,
  deadline_ms INTEGER NOT NULL
);
