ALTER TABLE activity_submissions RENAME TO activity_submissions_numbered;
CREATE TABLE activity_submissions (
  week INTEGER NOT NULL,
  group_name TEXT NOT NULL,
  browser_id TEXT NOT NULL,
  members TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_one TEXT NOT NULL,
  image_two TEXT,
  tableau_url TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (week, group_name)
);
INSERT INTO activity_submissions
  (week,group_name,browser_id,members,title,description,image_one,image_two,updated_at)
SELECT week,CAST(group_number AS TEXT),browser_id,members,title,description,image_one,image_two,updated_at
FROM activity_submissions_numbered;
