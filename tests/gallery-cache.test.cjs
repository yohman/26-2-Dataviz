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
  const current = fs.readFileSync('index.html','utf8').match(/src="(assets\/site\.js\?v=[^"]+)"/)[1];
  for (const page of ['gallery.html', 'gallery-work.html']) {
    assert.ok(fs.readFileSync(page, 'utf8').includes(current), `${page} must load the current shared script`);
  }
});

test('an empty live feed cannot erase the published gallery or work view', async () => {
  const vm = require('node:vm');
  const source = fs.readFileSync('assets/site.js', 'utf8');
  const fn = source.slice(source.indexOf('async function requestGalleryItems()'), source.indexOf('function loadGalleryItems()'));
  const window = {};
  const context = { window, COURSE_CONFIG: { GALLERY_API_URL: 'https://example.com/feed' }, AbortSignal,
    fetch:async()=>({ok:true,json:async()=>({items:[],nextCursor:null})}) };
  vm.runInNewContext(fn, context);
  await assert.rejects(context.requestGalleryItems(), /keeping the published snapshot/);
  assert.equal(window.courseGalleryReceive, undefined);
  assert.match(fs.readFileSync('scripts/sync-gallery.mjs', 'utf8'), /if\(!items.length\)throw/);
});
