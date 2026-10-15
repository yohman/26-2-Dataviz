CREATE TABLE IF NOT EXISTS activity_submissions (
  week INTEGER NOT NULL,
  group_number INTEGER NOT NULL,
  browser_id TEXT NOT NULL,
  members TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_one TEXT NOT NULL,
  image_two TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (week, group_number)
);
