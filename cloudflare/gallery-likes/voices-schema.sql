CREATE TABLE IF NOT EXISTS voice_rooms (
  code TEXT PRIMARY KEY, title TEXT NOT NULL, host_hash TEXT NOT NULL,
  open INTEGER NOT NULL DEFAULT 1, revision INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS voice_entries (
  seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT NOT NULL UNIQUE,
  room TEXT NOT NULL REFERENCES voice_rooms(code), browser TEXT NOT NULL,
  headline TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '', change_text TEXT NOT NULL DEFAULT '',
  -- Text-only voices store [] and 0 for unspecified metadata; public feeds expose ratings as null.
  categories TEXT NOT NULL, reach INTEGER NOT NULL, urgency INTEGER NOT NULL,
  hidden INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS voice_room_seq ON voice_entries(room,seq);
CREATE TABLE IF NOT EXISTS voice_resonance (
  entry TEXT NOT NULL REFERENCES voice_entries(id), browser TEXT NOT NULL,
  PRIMARY KEY(entry,browser)
);
