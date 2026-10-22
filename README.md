# 2026–2 Data Visualization

Editable bilingual content lives in `content/weeks/*.md`. Serve the local clone
on port 8767. GitHub Pages hosts the frontend.

## Cloudflare backend

Worker: `https://dataviz-gallery-likes.ykawano.workers.dev`
Source: `cloudflare/gallery-likes/`.

- D1 `dataviz-course` (`COURSE_DB`): homework, private revision history, original Google response archives, week deadlines, and chunked screenshot images.
- Existing D1 `dataviz-gallery-likes` (`DB`): hearts, comments, and in-class group work. It remains authoritative, so votes posted during migration are not lost.
- Existing `week-imageIndex` work IDs and `dataviz-heart-browser` identities stay unchanged.
- `GET /gallery` is public, cursor-paginated JSON (250 works per page). No JSONP or 1,000-record application cap.
- `GET /gallery-image?key=…` serves immutable screenshot images directly from D1. Monitor D1 storage and move images to R2 when enabled.
- `/homework?week=N` supplies deadlines and accepts submissions from `homework-submit.html`. One screenshot required, two allowed. Shared notebook/project URL is optional.
- Student IDs are hashed in the current-work table. Original response archives and private revision details have no public API route.
- Resubmissions preserve the work ID and its hearts/comments. Same-browser ownership or a saved revision code is required. This is not university SSO.
- Server-side deadlines match the agenda: 23:59 JST the night before the next class. Update `week_schedule` if course dates change.

Google Apps Script and Google Forms are no longer used by the running site.
`google-apps-script/` remains only as a historical source/rollback record.
The original Sheet and Drive files remain untouched.

## Deployment and backup

Run `node --test tests/*.cjs tests/*.mjs`.
Deploy with `wrangler deploy --config cloudflare/gallery-likes/wrangler.jsonc`.
Do not swap the D1 bindings: current hearts/comments remain in `DB`.

`node scripts/sync-gallery.mjs` refreshes the sanitized public JSON and embedded
failure fallback from Cloudflare. The Pages workflow runs it on pushes and every
30 minutes. Browsers also fetch the current Cloudflare feed independently.

`scripts/migrate-course-d1.mjs` is a one-time tool, not a runtime dependency. It
reads private exports from `/tmp/`, verifies original rows against public IDs,
and creates a private SQL import outside the repo. Never commit private exports,
migration SQL, database backups, or credentials.
