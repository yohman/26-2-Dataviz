CREATE TABLE likes (
  submission_id TEXT NOT NULL,
  browser_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (submission_id, browser_id)
);
CREATE INDEX likes_browser ON likes(browser_id);
