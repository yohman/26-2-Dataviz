const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const context = { document: { addEventListener() {} }, window: {}, URL };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/site.js'), 'utf8'), context);

test('pasted source URLs become separate safe links, including adjacent URLs', () => {
  const urls = vm.runInContext("galleryUrls('https://songdata.io/https://docs.google.com/spreadsheets/d/abc/edit　https://example.org/data。')", context);
  assert.deepEqual([...urls], [
    'https://songdata.io/',
    'https://docs.google.com/spreadsheets/d/abc/edit',
    'https://example.org/data'
  ]);
  assert.deepEqual([...vm.runInContext("galleryUrls('No website supplied')", context)], []);
});
