# 2026–2 Data Visualization

Static, bilingual course site for GitHub Pages. There is no build step: enable
Pages for the repository root.

## Edit the course

- Page content is in the root `.html` files.
- Each week's bilingual agenda, assignment, materials, date, and tools live in
  one Markdown file under `content/weeks/`. Edit that week's file only. See
  `content/README.md` for the field guide.
- `assets/site.js` loads the weekly Markdown and renders the Agenda, homepage
  next-week card, and gallery.
- Shared visual styles are in `assets/styles.css`. Static Japanese interface
  translations are in `assets/i18n.js`.

## Weekly submissions

The Japanese Google Form collects student ID, email, name, week, title, tools,
project link, a required image screenshot, and a short explanation. It tells
students that their names and work appear in the gallery, while IDs and email
addresses stay private. Each homework card opens the same form with its week
prefilled.

The form URL and week field are configured in `COURSE_CONFIG` in
`assets/site.js`. Its response sheet stays private.

## Gallery feed

`google-apps-script/gallery-feed.gs` is the source for a script bound to the
private response sheet. It reads the sheet through Google's Spreadsheet service
and makes a read-only feed for the GitHub Pages gallery. It is deployed as a
web app running as the owner, with access for everyone. Its published `/exec`
URL is configured as `GALLERY_API_URL` in `assets/site.js`. After editing the
script, deploy a new version of that same web app so the URL stays stable.

The script selects the newest response for each **student ID + week**. Students
can resubmit; the latest submission replaces the earlier one in the gallery.
Student IDs and email addresses never leave the script. Its output has
the public fields `week`, `challenge`, `submittedAt`, `studentName`, `title`,
`tools`, `projectUrl`, `description`, and `imageIndex`. Screenshots load through
a separate call only when their cards come into view. The original uploaded
Drive files stay private, and images from superseded submissions cannot be
requested through the feed.

The feed uses a fixed JSONP callback, `courseGalleryReceive`, because the site
is hosted on GitHub Pages. If the feed is unavailable, the gallery shows an
unavailable message rather than sample student work.

Run `node --test tests/gallery-feed.test.cjs` to check the latest-response and
privacy rules before deploying changes to the script.
