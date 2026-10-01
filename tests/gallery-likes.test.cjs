const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const rows = [];
const sheet = {
  appendRow(row) { rows.push(row); },
  getDataRange() { return { getValues: () => rows.map(row => [...row]) }; },
  hideSheet() {}
};
let created = false;
const book = {
  getSheetByName() { return created ? sheet : null; },
  insertSheet() { created = true; return sheet; }
};
const context = {
  SpreadsheetApp: { getActiveSpreadsheet: () => book },
  LockService: { getDocumentLock: () => ({ waitLock() {}, releaseLock() {} }) },
  Utilities: {
    DigestAlgorithm: { SHA_256: 'SHA_256' },
    computeDigest: (_algorithm, visitor) => visitor,
    base64EncodeWebSafe: value => value
  },
  output: value => value,
  Date
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../scripts/gallery-likes-apps-script.gs'), 'utf8'), context);
const call = (action, visitor, item = '') => {
  context.request = { parameter: { action, visitor, item } };
  return vm.runInContext('galleryLikesApi(request)', context);
};
const first = '123e4567-e89b-42d3-a456-426614174000';
const second = '123e4567-e89b-42d3-a456-426614174001';

test('a browser can like several cards but only once per card', () => {
  assert.equal(call('like', first, '1-21').counts['1-21'], 1);
  assert.equal(call('like', first, '1-21').counts['1-21'], 1);
  const result = call('like', first, '1-22');
  assert.equal(result.counts['1-22'], 1);
  assert.deepEqual([...result.mine].sort(), ['1-21', '1-22']);
});

test('shared totals include other browsers while mine stays personal', () => {
  const result = call('like', second, '1-21');
  assert.equal(result.counts['1-21'], 2);
  assert.deepEqual([...result.mine], ['1-21']);
  assert.equal(call('likes', first).counts['1-21'], 2);
});

test('invalid browser and card IDs do not create likes', () => {
  assert.equal(call('like', 'not-an-id', '1-21').error, 'Invalid like request');
  assert.equal(call('like', first, 'other-sheet').error, 'Invalid like request');
  assert.equal(call('likes', first).counts['1-21'], 2);
});
