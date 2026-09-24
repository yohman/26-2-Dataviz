import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const feed = process.env.GALLERY_FEED_URL || 'https://script.google.com/macros/s/AKfycbyMs5EMzHkKXnHGE0LH-H4r1RnrZXYw77WiWO_vhb7gHL9ZFGzDYpJIwVhsookMCSmjsA/exec';
const publishedSite = 'https://yohman.github.io/26-2-Dataviz/';
const root = resolve(process.argv[2] || '.');
const fields = ['week', 'challenge', 'submittedAt', 'studentName', 'title', 'tools', 'projectUrl', 'description', 'imageIndex'];

async function request(params, callback) {
  const url = new URL(feed);
  Object.entries({ ...params, callback }).forEach(([key, value]) => url.searchParams.set(key, value));
  let failure;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`Gallery feed HTTP ${response.status}`);
      const source = await response.text();
      const match = source.match(new RegExp(`^\\s*${callback}\\((.*)\\);?\\s*$`, 's'));
      return JSON.parse(match ? match[1] : source);
    } catch (error) {
      failure = error;
      if (attempt < 2) await new Promise(done => setTimeout(done, 800 * (attempt + 1)));
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
  for (const original of source.items) {
    const item = Object.fromEntries(fields.map(field => [field, original[field] ?? '']));
    if (!Number.isInteger(Number(item.week)) || Number(item.week) < 1 || Number(item.week) > 14) throw new Error('Invalid week');
    if (!Number.isInteger(Number(item.imageIndex)) || Number(item.imageIndex) < 0) throw new Error('Invalid image index');
    let bytes;
    let extension;
    if (fromPublishedSite) {
      const path = String(original.imageUrl || '');
      if (!/^assets\/gallery\/[a-f0-9]{24}\.(png|jpg|webp|gif)$/.test(path)) throw new Error('Invalid published gallery image path');
      const response = await fetch(new URL(path, publishedSite), { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`Published gallery image HTTP ${response.status}`);
      bytes = Buffer.from(await response.arrayBuffer());
      extension = path.split('.').at(-1);
    } else {
      const image = await request({ image: item.imageIndex }, 'gallerySnapshotImageReceive');
      if (Number(image.index) !== Number(item.imageIndex)) throw new Error('Image index mismatch');
      const match = String(image.data || '').match(/^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/=]+)$/);
      if (!match) throw new Error('Invalid gallery image');
      bytes = Buffer.from(match[2], 'base64');
      extension = match[1] === 'jpeg' ? 'jpg' : match[1];
    }
    if (!bytes.length || bytes.length > 15_000_000) throw new Error('Invalid gallery image size');
    const filename = `${createHash('sha256').update(bytes).digest('hex').slice(0, 24)}.${extension}`;
    await writeFile(join(root, 'assets/gallery', filename), bytes);
    item.imageUrl = `assets/gallery/${filename}`;
    items.push(item);
  }
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
const marker = '<script id="gallery-snapshot" type="application/json"></script>';
if (!gallery.includes(marker)) throw new Error('Gallery page is missing its snapshot placeholder');
const inline = snapshot.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
const preloads = items.slice(0, 3).map(item => `<link rel="preload" as="image" href="${item.imageUrl}">`).join('');
await writeFile(galleryPath, gallery.replace(marker, `${preloads}<script id="gallery-snapshot" type="application/json">${inline}</script>`));
console.log(`Published ${items.length} gallery works without IDs or email addresses.`);
