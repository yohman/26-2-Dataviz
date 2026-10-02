const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const context = { document: { addEventListener() {} }, window: {}, URL, URLSearchParams };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/site.js'), 'utf8'), context);

test('gallery work links retain the active week, tool, and chart filters', () => {
  const href = vm.runInContext("galleryPageUrl({ week: 1, imageIndex: 21 }, 'all', 'Google Sheets', 'bar')", context);
  const url = new URL(href, 'https://example.org/');
  assert.equal(url.pathname, '/gallery-work.html');
  assert.equal(url.searchParams.get('id'), '1-21');
  assert.equal(url.searchParams.get('week'), 'all');
  assert.equal(url.searchParams.get('tool'), 'Google Sheets');
  assert.equal(url.searchParams.get('chart'), 'bar');
});

test('previous and next can use the same filtered item sequence as the gallery', () => {
  const selected = vm.runInContext(`galleryFilterItems([
    { week: 1, imageIndex: 1, tools: 'Excel', description: '棒グラフ' },
    { week: 1, imageIndex: 2, tools: 'Python', description: '棒グラフ' },
    { week: 1, imageIndex: 3, tools: 'Excel', description: '地図' },
    { week: 2, imageIndex: 4, tools: 'Excel', description: '棒グラフ' },
    { week: 1, imageIndex: 5, tools: 'Excel', description: '棒グラフ' }
  ], '1', 'Excel', 'bar').map(galleryItemKey)`, context);
  assert.deepEqual([...selected], ['1-1', '1-5']);
});

test('most-liked sorting and my-likes filtering share the work-page sequence', () => {
  const selected = vm.runInContext(`(() => {
    galleryLikesCounts = { '1-2': 4, '1-3': 4, '1-1': 1 };
    galleryLikesMine = new Set(['1-1', '1-3']);
    return galleryVisibleItems([
      { week: 1, imageIndex: 1 },
      { week: 1, imageIndex: 2 },
      { week: 1, imageIndex: 3 }
    ], '1', '', '', 'likes', true).map(galleryItemKey);
  })()`, context);
  assert.deepEqual([...selected], ['1-3', '1-1']);
  const href = vm.runInContext("galleryPageUrl({ week: 1, imageIndex: 3 }, '1', '', '', 'likes', true)", context);
  const url = new URL(href, 'https://example.org/');
  assert.equal(url.searchParams.get('sort'), 'likes');
  assert.equal(url.searchParams.get('liked'), '1');
});

test('two-image works use their distinct cached images and single-image works stay single', () => {
  const images = vm.runInContext(`(() => {
    const work = { imageIndex: 7, imageCount: 2, imageUrl: 'first.png', imageUrls: ['first.png', 'second.png'] };
    return [galleryImageCount(work), galleryImageSource(work, 1), galleryImageSource(work, 2), galleryImageCount({ imageIndex: 8 })];
  })()`, context);
  assert.deepEqual([...images], [2, 'first.png', 'second.png', 1]);
});

test('an unchanged live feed does not require repainting gallery images or cards', () => {
  const result = vm.runInContext(`(() => {
    const cached = [{ week: 1, imageIndex: 7, title: 'A', imageUrl: 'cached.jpg', imageCount: 1 }];
    const unchanged = [{ week: 1, imageIndex: 7, title: 'A', imageCount: 1 }];
    const revised = [{ week: 1, imageIndex: 7, title: 'B', imageCount: 1 }];
    return [sameGalleryItems(cached, unchanged), sameGalleryItems(cached, revised)];
  })()`, context);
  assert.deepEqual([...result], [true, false]);
});

test('likes work when randomUUID is unavailable but browser storage works', () => {
  const saved = new Map();
  context.localStorage = { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) };
  context.crypto = { getRandomValues: bytes => bytes.fill(7) };
  context.document.cookie = '';
  const result = vm.runInContext('({ id: galleryVisitorId(), persistent: galleryVisitorPersistent })', context);
  assert.match(result.id, /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
  assert.equal(result.persistent, true);
  assert.equal(saved.get('dataviz-gallery-browser-id'), result.id);
});

test('likes use a first-party cookie when localStorage is unavailable', () => {
  context.localStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  context.document.cookie = '';
  const result = vm.runInContext('({ id: galleryVisitorId(), persistent: galleryVisitorPersistent })', context);
  assert.equal(result.persistent, true);
  assert.match(context.document.cookie, new RegExp(`dataviz-gallery-browser-id=${result.id}`));
});

test('a temporary ID stays stable for counts when all browser storage is blocked', () => {
  context.document.cookie = '';
  Object.defineProperty(context.document, 'cookie', { configurable: true, get: () => '', set() {} });
  const result = vm.runInContext('({ first: galleryVisitorId(), second: galleryVisitorId(), persistent: galleryVisitorPersistent })', context);
  assert.equal(result.first, result.second);
  assert.equal(result.persistent, false);
});

test('likes prefer a readable browser request over an injected script', async () => {
  const visitor = '123e4567-e89b-42d3-a456-426614174000';
  let requestedUrl = '';
  const storage = new Map();
  const isolated = { document: { addEventListener() {}, cookie: '' }, window: {}, URLSearchParams,
    AbortController, setTimeout, clearTimeout, crypto: { randomUUID: () => visitor },
    localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    fetch: async url => { requestedUrl = url; return { ok: true, json: async () => ({ counts: { '1-1': 2 }, mine: [] }) }; } };
  vm.createContext(isolated);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/site.js'), 'utf8'), isolated);
  const response = await vm.runInContext("requestGalleryLikes('likes')", isolated);
  assert.equal(response.counts['1-1'], 2);
  assert.match(requestedUrl, /action=likes/);
  assert.match(requestedUrl, new RegExp(`visitor=${visitor}`));
});

test('likes retain the script fallback when a browser rejects the readable request', async () => {
  const visitor = '123e4567-e89b-42d3-a456-426614174000';
  const isolated = { window: {}, URLSearchParams, AbortController, setTimeout, clearTimeout,
    crypto: { randomUUID: () => visitor },
    localStorage: { getItem: () => visitor, setItem() {} },
    fetch: async () => { throw new TypeError('blocked'); } };
  let injected = 0;
  isolated.document = { addEventListener() {}, cookie: '', createElement: () => ({ remove() {} }),
    head: { append(script) {
      injected++;
      const callback = new URL(script.src).searchParams.get('callback');
      queueMicrotask(() => isolated.window[callback]({ counts: { '1-1': 3 }, mine: [] }));
    } } };
  vm.createContext(isolated);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/site.js'), 'utf8'), isolated);
  const response = await vm.runInContext("requestGalleryLikes('likes')", isolated);
  assert.equal(response.counts['1-1'], 3);
  assert.equal(injected, 1);
});

test('an uncached work shows loading until the live feed confirms it is missing', () => {
  const root = { replaceChildren(...children) { this.children = children; } };
  context.document.querySelector = () => root;
  context.document.createElement = tagName => ({ tagName, className: '', textContent: '', children: [],
    setAttribute() {}, append(...children) { this.children.push(...children); } });
  context.window.courseLanguage = 'ja';
  context.location = { search: '?id=1-999999&week=1' };
  vm.runInContext("galleryWorkLiveStatus = 'pending'; paintGalleryWork([])", context);
  assert.equal(root.children[0].className, 'gallery-work-loading');
  assert.equal(root.children[0].children[1].textContent, '作品を読み込んでいます…');
  vm.runInContext("galleryWorkLiveStatus = 'loaded'; paintGalleryWork([])", context);
  assert.equal(root.children[0].textContent, '作品が見つかりません');
});
