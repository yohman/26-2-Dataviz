# 2026–2 Data Visualization

Static, bilingual course site for GitHub Pages. It has no build step: upload this
folder to a repository, then enable **Settings → Pages → Deploy from a branch**
and choose the repository root.

## Edit the course

- Page content is in the root \`.html\` files.
- Each week's bilingual agenda, assignment, materials, date, suggested tools,
  and optional image live in its own Markdown file under \`content/weeks/\`.
  Edit that week's file only; the Agenda and homepage NEXT WEEK card load it
  directly. See \`content/README.md\` for the field guide.
- \`assets/site.js\` loads and renders the weekly Markdown, and contains the
  form configuration and gallery logic.
- Shared visual styles are in \`assets/styles.css\`.
- Japanese interface copy is centralized in \`assets/i18n.js\`; each week’s
  Japanese content is beside its English equivalent in the same Markdown file.

## Configure submissions

Create one Google Form and collect at minimum:

1. Timestamp (automatic)
2. Student email or another stable, non-public student ID
3. Student name
4. Week number
5. Challenge title
6. Submission title
7. Short description / what the work reveals
8. Tools used
9. Project URL
10. Image URL or uploaded-image link, if available
11. Consent to display the work publicly

In \`assets/site.js\`, replace only these three placeholder values in
\`COURSE_CONFIG\`:

- \`GOOGLE_FORM_URL\` — the form's public **viewform** URL.
- \`GOOGLE_FORM_WEEK_ENTRY_ID\` — the Google Form field ID for the week
  question, such as \`entry.123456789\`. Each expanded homework card pre-fills it.
- \`GALLERY_API_URL\` — a public, read-only Apps Script web-app (or equivalent)
  JSON feed. Never put spreadsheet credentials or a private sheet URL here.

Until the endpoint is configured, the Gallery deliberately displays sample work.

## Gallery feed contract

The endpoint must return a JSON array. Each object should use these names:

\`\`\`json
{
  "timestamp": "2026-10-13T10:00:00Z",
  "studentId": "stable-nonpublic-id",
  "studentName": "Aiko S.",
  "week": 3,
  "challenge": "Data Into Form",
  "title": "After the Rain",
  "description": "What the work reveals.",
  "tools": "Tableau, Excel",
  "projectUrl": "https://example.org/work",
  "imageUrl": "https://example.org/thumbnail.jpg",
  "consent": true
}
\`\`\`

The client shows only rows with \`consent: true\`, never displays the student ID
or email, and deduplicates records by **studentId + week**. When a student
submits more than once, the newest valid timestamp is the one shown; older form
rows remain intact in the spreadsheet.

Use a separate Apps Script deployment that reads only the intended public
fields. Test its URL in a private browser window before publishing the site.
