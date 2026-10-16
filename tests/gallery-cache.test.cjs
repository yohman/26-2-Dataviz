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
    assert.match(fs.readFileSync(page, 'utf8'), /site\.js\?v=gallery-fresh-data-20261016/);
  }
});
