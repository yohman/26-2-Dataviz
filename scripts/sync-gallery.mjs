import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const feed = process.env.GALLERY_FEED_URL || 'https://script.google.com/macros/s/AKfycbx0QJbdytCdRNdCTGPsMhfkMC3HFRImz9-VUCebCoZ6XjdVlieGwDDzmpxuxg0ORVZb5Q/exec';
const publishedSite = 'https://yohman.github.io/26-2-Dataviz/';
const root = resolve(process.argv[2] || '.');
const fields = ['week', 'challenge', 'submittedAt', 'studentName', 'title', 'tools', 'projectUrl', 'description', 'imageIndex', 'imageCount'];
const cachedImages = new Map();
try {
  const previous = JSON.parse(await readFile(join(root, 'data/gallery-public.json'), 'utf8'));
  for (const item of previous.items || []) {
    (item.imageUrls || [item.imageUrl]).forEach((path, index) => {
      if (path) cachedImages.set(`${item.week}:${item.imageIndex}:${item.title}:${index + 1}`, path);
    });
  }
} catch { /* A first build has no local snapshot. */ }

async function request(params, callback, attempts = 3, timeoutMs = 20000) {
  const url = new URL(feed);
  Object.entries({ ...params, callback }).forEach(([key, value]) => url.searchParams.set(key, value));
  let failure;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
      if (!response.ok) throw new Error(`Gallery feed HTTP ${response.status}`);
      const source = await response.text();
      const match = source.match(new RegExp(`^\\s*${callback}\\((.*)\\);?\\s*$`, 's'));
      return JSON.parse(match ? match[1] : source);
    } catch (error) {
      failure = error;
      if (attempt < attempts - 1) await new Promise(done => setTimeout(done, 800 * (attempt + 1)));
    }
  }
  throw failure;
}

async function publishedSnapshot() {
  const response = await fetch(new URL('gallery.html', publishedSite), { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`Published gallery HTTP ${response.status}`);
  const html = await response.text();
  const inline = html.match(/<script id="gallery-snapshot" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
  if (!inline) throw new Error('Published gallery has no snapshot');
  const snapshot = JSON.parse(inline);
  if (!Array.isArray(snapshot.items)) throw new Error('Published gallery has no items array');
  return snapshot;
}

let payload;
let usePublishedSnapshot = false;
try {
  payload = await request({}, 'gallerySnapshotReceive');
  if (!Array.isArray(payload.items)) throw new Error('Gallery feed has no items array');
} catch (error) {
  console.warn(`Gallery feed unavailable (${error.message}); reusing the published snapshot.`);
  payload = await publishedSnapshot();
  usePublishedSnapshot = true;
}
await mkdir(join(root, 'assets/gallery'), { recursive: true });
await mkdir(join(root, 'data'), { recursive: true });
async function buildItems(source, fromPublishedSite) {
  const items = [];
  async function buildItem(original) {
    const item = Object.fromEntries(fields.map(field => [field, original[field] ?? '']));
    if (!Number.isInteger(Number(item.week)) || Number(item.week) < 1 || Number(item.week) > 14) throw new Error('Invalid week');
    if (!Number.isInteger(Number(item.imageIndex)) || Number(item.imageIndex) < 0) throw new Error('Invalid image index');
    item.imageCount = Number(original.imageCount) === 2 || original.imageUrls?.length === 2 ? 2 : 1;
    item.imageUrls = [];
    for (let slot = 1; slot <= item.imageCount; slot++) {
      const cached = cachedImages.get(`${item.week}:${item.imageIndex}:${item.title}:${slot}`);
      if (/^assets\/gallery\/[a-f0-9]{24}\.(png|jpg|webp|gif)$/.test(cached || '')) {
        try {
          if ((await stat(join(root, cached))).isFile()) { item.imageUrls.push(cached); continue; }
        } catch { /* Rebuild a missing cached image. */ }
      }
      try {
        let bytes;
        let extension;
        if (fromPublishedSite) {
          const path = String(original.imageUrls?.[slot - 1] || (slot === 1 ? original.imageUrl : '') || '');
          if (!/^assets\/gallery\/[a-f0-9]{24}\.(png|jpg|webp|gif)$/.test(path)) throw new Error('Invalid published gallery image path');
          const response = await fetch(new URL(path, publishedSite), { signal: AbortSignal.timeout(20000) });
          if (!response.ok) throw new Error(`Published gallery image HTTP ${response.status}`);
          bytes = Buffer.from(await response.arrayBuffer());
          extension = path.split('.').at(-1);
        } else {
          const image = await request({ image: item.imageIndex, slot }, 'gallerySnapshotImageReceive', 1, 12000);
          if (Number(image.index) !== Number(item.imageIndex) || Number(image.slot) !== slot) throw new Error('Image index mismatch');
          const match = String(image.data || '').match(/^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/=]+)$/);
          if (!match) throw new Error('Invalid gallery image');
          bytes = Buffer.from(match[2], 'base64');
          extension = match[1] === 'jpeg' ? 'jpg' : match[1];
        }
        if (!bytes.length || bytes.length > 15_000_000) throw new Error('Invalid gallery image size');
        const filename = `${createHash('sha256').update(bytes).digest('hex').slice(0, 24)}.${extension}`;
        await writeFile(join(root, 'assets/gallery', filename), bytes);
        item.imageUrls.push(`assets/gallery/${filename}`);
      } catch (error) {
        console.warn(`Gallery image ${item.imageIndex}, slot ${slot} unavailable (${error.message}); leaving it to the live feed.`);
        item.imageUrls.push('');
      }
    }
    item.imageUrl = item.imageUrls[0];
    return item;
  }
  let cursor = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (cursor < source.items.length) {
      const index = cursor++;
      items[index] = await buildItem(source.items[index]);
    }
  }));
  return items;
}

let items;
try {
  items = await buildItems(payload, usePublishedSnapshot);
} catch (error) {
  if (usePublishedSnapshot) throw error;
  console.warn(`Gallery images unavailable (${error.message}); reusing the published snapshot.`);
  items = await buildItems(await publishedSnapshot(), true);
}
const snapshot = JSON.stringify({ generatedAt: new Date().toISOString(), items });
await writeFile(join(root, 'data/gallery-public.json'), snapshot);
const galleryPath = join(root, 'gallery.html');
const gallery = await readFile(galleryPath, 'utf8');
const snapshotBlock = /(?:<link rel="preload" as="image" href="[^"]*">)*<script id="gallery-snapshot" type="application\/json">[\s\S]*?<\/script>/;
if (!snapshotBlock.test(gallery)) throw new Error('Gallery page is missing its snapshot block');
const inline = snapshot.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
const preloads = items.filter(item => item.imageUrl).slice(0, 3).map(item => `<link rel="preload" as="image" href="${item.imageUrl}">`).join('');
await writeFile(galleryPath, gallery.replace(snapshotBlock, `${preloads}<script id="gallery-snapshot" type="application/json">${inline}</script>`));
console.log(`Published ${items.length} gallery works without IDs or email addresses.`);
