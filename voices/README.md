# Voices for Justice / 声を、かたちに。

A standalone bilingual classroom activity at `voices/`.
The visual identity is a dark protest-poster wall: charcoal, red/gold/green
accents, bold type, angled statements and restrained restless movement.
New arrivals rise into the field; reduced-motion and pause preferences still apply. The landing page creates
separate sessions for future presentations. The participation link opens the
short anonymous form; the session URL opens the live wall. Updates poll Cloudflare
every 2.8 seconds on the presentation wall while visible, with revision checks to
avoid unnecessary redraws. Participation links refresh about every 15 seconds;
open intake forms and hidden tabs do not poll. Submitting or reacting refreshes
immediately, so a classroom of phones does not multiply presentation-rate traffic.

## Presenting

- Create a session, then project **Invite / QR**. No student accounts are needed.
- The intake is one open text box (up to 500 characters) and Send. No themes,
  urgency rating, or reach questions are required or inferred. Long messages
  retain their full text behind a short headline.
- Earlier structured submissions retain their participant-chosen themes and ratings.
  New open-text voices remain unclassified and unrated; they use a standard
  display size and never receive invented network links or map coordinates.
- The default is a typographic landscape. Drag, wheel/pinch, or use the quiet
  zoom controls to wander. Arrow keys pan; Home fits the landscape. Selecting a
  voice opens its story. **Let it wander** takes a slow camera walk.
- Text size expresses self-reported urgency; a colored dot identifies the first
  chosen theme. Positions are thematic layout, not measured geography or distance.
- **Threads** reveals sparse paths between voices with a shared participant-chosen
  theme. Search, theme filters, and the original analytic views live in the explore
  drawer; invitation, pause, moderation, and export are available from session tools.
- Wall: text size is urgency. Clusters/map: circle area is 1 + echoes.
- Map axes use self-reported reach and urgency on older rated voices only.
  Unrated voices are omitted from that view. Jitter has no data meaning.
- Network links count co-occurring themes; distances are only layout.
- Echoes are limited to one per browser per voice and can be reversed.
- Incoming voices materialize in the current landscape and settle among related
  themes. Other views slide them into the wall, ripple into bubbles, and illuminate
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

Open-text metadata: the existing NOT NULL integer columns store 0 as an unset
sentinel; public feeds expose those values as null, with an empty category list.
Older structured clients remain compatible.
