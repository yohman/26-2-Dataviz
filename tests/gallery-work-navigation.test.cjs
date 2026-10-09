const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const context = { document: { addEventListener() {} }, window: {}, URL, URLSearchParams };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/site.js'), 'utf8'), context);

test('scroll zoom follows delta size gently, normalizes units, and caps jumps', () => {
  const factor = (delta, mode = 0) => vm.runInContext(`galleryScrollZoomFactor(${delta}, ${mode})`, context);
  assert.equal(factor(0), 1);
  assert(factor(1) > .998 && factor(1) < 1);
  assert(factor(-1) > 1 && factor(-1) < 1.002);
  assert.equal(factor(1, 1), factor(16));
  assert.equal(factor(10000), factor(100));
  assert(Math.abs(factor(20) * factor(-20) - 1) < 1e-12);
});

test('same-count stale session entries adopt locally hosted images without losing metadata', () => {
  const result = vm.runInContext(`hydrateGalleryImages(
    [{week:2,imageIndex:74,imageCount:2,title:'newer title',imageUrls:[]}],
    [{week:2,imageIndex:74,imageCount:2,title:'older title',imageUrls:['first.png','second.png']}]
  )[0]`, context);
  assert.equal(result.title, 'newer title');
  assert.deepEqual([...result.imageUrls], ['first.png', 'second.png']);
});

test('gallery work links retain the active week, tool, and chart filters', () => {
  const href = vm.runInContext("galleryPageUrl({ week: 1, imageIndex: 21 }, 'all', 'Google Sheets', 'bar')", context);
  const url = new URL(href, 'https://example.org/');
  assert.equal(url.pathname, '/gallery-work.html');
  assert.equal(url.searchParams.get('id'), '1-21');
  assert.equal(url.searchParams.get('week'), 'all');
  assert.equal(url.searchParams.get('tool'), 'Google Sheets');
  assert.equal(url.searchParams.get('chart'), 'bar');
});

test('heart sorting retains filters and stable ordering for tied counts', () => {
  const ids = vm.runInContext(`(() => {
    galleryLikesState.set('2-1', {count:2});
    galleryLikesState.set('2-2', {count:5});
    galleryLikesState.set('2-3', {count:2});
    return galleryVisibleItems([
      {week:2,imageIndex:1,tools:'Excel'},
      {week:2,imageIndex:2,tools:'Excel'},
      {week:2,imageIndex:3,tools:'Excel'},
      {week:1,imageIndex:4,tools:'Excel'}
    ], '2', 'Excel', '', 'likes').map(galleryItemKey);
  })()`, context);
  assert.deepEqual([...ids], ['2-2', '2-1', '2-3']);
  const href = vm.runInContext("galleryPageUrl({week:2,imageIndex:2}, '2', 'Excel', '', 'likes')", context);
  assert.equal(new URL(href, 'https://test/').searchParams.get('sort'), 'likes');
});

test('my likes sort before higher public counts and preserve their original order', () => {
  const ids = vm.runInContext(`(() => {
    galleryLikesState.set('3-1', {count:99,liked:false});
    galleryLikesState.set('3-2', {count:1,liked:true});
    galleryLikesState.set('3-3', {count:2,liked:true});
    return galleryVisibleItems([1,2,3].map(imageIndex=>({week:3,imageIndex})), '3', '', '', 'mine').map(galleryItemKey);
  })()`, context);
  assert.deepEqual([...ids], ['3-2', '3-3', '3-1']);
  const href = vm.runInContext("galleryPageUrl({week:3,imageIndex:2}, '3', '', '', 'mine')", context);
  assert.equal(new URL(href, 'https://test/').searchParams.get('sort'), 'mine');
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
