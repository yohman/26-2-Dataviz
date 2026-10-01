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
