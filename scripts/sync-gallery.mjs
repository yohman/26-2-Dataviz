import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const feed = 'https://script.google.com/macros/s/AKfycbyMs5EMzHkKXnHGE0LH-H4r1RnrZXYw77WiWO_vhb7gHL9ZFGzDYpJIwVhsookMCSmjsA/exec';
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

const payload = await request({}, 'gallerySnapshotReceive');
if (!Array.isArray(payload.items)) throw new Error('Gallery feed has no items array');
const items = [];
await mkdir(join(root, 'assets/gallery'), { recursive: true });
await mkdir(join(root, 'data'), { recursive: true });
for (const original of payload.items) {
  const item = Object.fromEntries(fields.map(field => [field, original[field] ?? '']));
  if (!Number.isInteger(Number(item.week)) || Number(item.week) < 1 || Number(item.week) > 14) throw new Error('Invalid week');
  if (!Number.isInteger(Number(item.imageIndex)) || Number(item.imageIndex) < 0) throw new Error('Invalid image index');
  const image = await request({ image: item.imageIndex }, 'gallerySnapshotImageReceive');
  if (Number(image.index) !== Number(item.imageIndex)) throw new Error('Image index mismatch');
  const match = String(image.data || '').match(/^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error('Invalid gallery image');
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.length > 15_000_000) throw new Error('Invalid gallery image size');
  const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
  const filename = `${createHash('sha256').update(bytes).digest('hex').slice(0, 24)}.${extension}`;
  await writeFile(join(root, 'assets/gallery', filename), bytes);
  item.imageUrl = `assets/gallery/${filename}`;
  items.push(item);
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
