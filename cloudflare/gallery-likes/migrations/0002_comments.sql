CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL,
  browser_id TEXT NOT NULL,
  author TEXT NOT NULL CHECK(length(author) BETWEEN 1 AND 60),
  body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 1500),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX comments_submission ON comments(submission_id, created_at, id);
