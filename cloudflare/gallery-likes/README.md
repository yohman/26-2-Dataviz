# Cloudflare gallery hearts

Deployed endpoint: https://dataviz-gallery-likes.ykawano.workers.dev/likes
Connected to gallery cards and individual work pages. Likes load independently
of cards and images, with bounded requests and optimistic updates.
From this directory, using the intended Cloudflare account:

```sh
npx wrangler login
npx wrangler d1 create dataviz-gallery-likes
# Copy the returned database_id into wrangler.jsonc.
npx wrangler d1 migrations apply dataviz-gallery-likes --local
npx wrangler dev
# After local integration verification:
npx wrangler d1 migrations apply dataviz-gallery-likes --remote
npx wrangler deploy
```

Persist crypto.randomUUID() in localStorage and send it as X-Browser-ID.
GET /likes returns all counts and this browser's selections in one query.
PUT /likes accepts {"id":"2-76","liked":true}; false removes the like.
Repeated requests are idempotent. The composite primary key prevents duplicates.
Missing items in a successful bulk response have zero likes.

Frontend integration must render cards/images without waiting for this service,
update hearts optimistically, and roll back failed writes. Do not show fake counts.
Keep existing submission IDs stable and keep account secrets off the frontend.

This is browser-level identity, not authenticated voting. Clearing storage or
using another device permits another like. CORS is not authentication.
Worker rate limiting permits 120 requests per browser identity per minute.
Duplicate like and unlike operations have been tested on the deployed API.
Still verify browser interactions and behavior on a second computer.
