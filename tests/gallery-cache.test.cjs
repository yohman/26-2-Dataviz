const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

test('gallery requests a fresh snapshot before falling back to embedded HTML', () => {
  const source = fs.readFileSync('assets/site.js', 'utf8');
  const gallery = source.slice(source.indexOf('async function renderGallery()'), source.indexOf('function renderCourse()'));
  const fresh = gallery.indexOf("fetch(`data/gallery-public.json?t=${Date.now()}`, { cache: 'no-store' })");
  const fallback = gallery.indexOf("document.querySelector('#gallery-snapshot')");
  assert.ok(fresh >= 0 && fallback > fresh);
  assert.doesNotMatch(gallery, /saved\.length >= items\.length/);
  assert.match(gallery, /loadGalleryItems\(\)\.then/);
});

test('gallery and individual work pages load the cache fix', () => {
  for (const page of ['gallery.html', 'gallery-work.html']) {
    assert.match(fs.readFileSync(page, 'utf8'), /site\.js\?v=gallery-empty-feed-20261023/);
  }
});

test('an empty live feed cannot erase the published gallery or work view', async () => {
  const vm = require('node:vm');
  const source = fs.readFileSync('assets/site.js', 'utf8');
  const fn = source.slice(source.indexOf('function requestGalleryItems()'), source.indexOf('function loadGalleryItems()'));
  const window = {};
  const context = { window, COURSE_CONFIG: { GALLERY_API_URL: 'https://example.com/feed' },
    setTimeout, clearTimeout, document: {
      createElement: () => ({ remove() {} }),
      head: { append: () => queueMicrotask(() => window.courseGalleryReceive({ items: [] })) }
    } };
  vm.runInNewContext(fn, context);
  await assert.rejects(context.requestGalleryItems(), /keeping the published snapshot/);
  assert.equal(window.courseGalleryReceive, undefined);
  assert.match(fs.readFileSync('scripts/sync-gallery.mjs', 'utf8'), /payload\.items\.length === 0/);
});
