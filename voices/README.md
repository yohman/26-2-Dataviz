# Voices for Justice / 声を、かたちに。

A standalone bilingual classroom activity at `voices/`. The landing page creates
separate sessions for future presentations. The participation link opens the
short anonymous form; the session URL opens the live wall. Updates poll Cloudflare
every 2.8 seconds on the presentation wall while visible, with revision checks to
avoid unnecessary redraws. Participation links refresh about every 15 seconds;
open intake forms and hidden tabs do not poll. Submitting or reacting refreshes
immediately, so a classroom of phones does not multiply presentation-rate traffic.

## Presenting

- Create a session, then project **Invite / QR**. No student accounts are needed.
- Themes are chosen by participants, not inferred by AI. Up to two per voice.
- Wall: text size is urgency. Clusters/map: circle area is 1 + echoes.
- Map axes use self-reported reach and urgency. Jitter has no data meaning.
- Network links count co-occurring themes; distances are only layout.
- Echoes are limited to one per browser per voice and can be reversed.
- Incoming voices slide into the wall, ripple into bubbles, and briefly illuminate
  their network themes and links. Existing cluster positions are retained. A short
  bilingual arrival notice keeps new voices visible without changing the current
  filter or interrupting the individual listening view. Initial history and reaction
  updates do not replay entrances; system reduced-motion preferences are respected.
- Pause freezes the display; close submissions stops new voices for everyone.
- Host can hide/restore voices and export CSV. Store the private host-link file
  securely to recover controls on another browser. Public invite links contain no
  host credentials. Closing a session does not make its public URL private.
- Submissions contain no name field; they are visible to anyone with the session
  link. The form explains this and asks participants to omit identifying details.
- Demo mode (`?demo`) uses clearly labeled fictional examples and never writes
  to the database. **Add a demo voice** previews arrivals in any visualization.
  Real sessions begin empty, without sample submissions.

## Backend

The existing Worker routes `/voices` to `voices.mjs`. Its `COURSE_DB` binding stores
only the `voice_*` tables defined in `voices-schema.sql`; course galleries, likes,
and comments are unaffected. Browser IDs remain server-side. Host secrets are
SHA-256 hashed in D1 and stored in the host browser; a recovery link uses a URL
fragment, removed before any API request. Feeds paginate in batches of 500 without
a 1000-row cap. No Google Apps Script or external AI service is involved.

Deploy the additive schema before the Worker:

```
wrangler d1 execute dataviz-course --remote --config cloudflare/gallery-likes/wrangler.jsonc --file cloudflare/gallery-likes/voices-schema.sql
wrangler deploy --config cloudflare/gallery-likes/wrangler.jsonc
```

Vendored libraries: D3 7.9.0 (ISC), QRCode.js 1.0.0 (MIT).
