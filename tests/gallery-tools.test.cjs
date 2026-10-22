const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const context = { document: { addEventListener() {} }, window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync('assets/site.js', 'utf8'), context);
function tools(raw) {
  context.raw = raw;
  return Array.from(vm.runInContext('matchedGalleryTools(raw)', context), tool => tool.name);
}
test('Tableau includes Public, capitalization, full-width input and clear spelling variants', () => {
  for (const value of ['Tableau', 'Tableau Public', 'TABLEAU', 'Ｔａｂｌｅａｕ', 'Tabeau', 'Tableu', 'Table Public', 'タブロー', 'タベロー']) {
    assert.ok(tools(value).includes('Tableau'), value);
  }
  assert.ok(!tools('Table').includes('Tableau'));
  assert.ok(!tools('CSV').includes('Tableau'));
});
test('tools count once per submission while supporting multiple tools', () => {
  context.items = [
    { tools: 'Tableau / Tableau Public' },
    { tools: 'tableau、Claude' },
    { tools: 'Tableau Ecxel, chat gpt' }
  ];
  const counts = vm.runInContext('galleryToolCounts(items)', context);
  assert.equal(counts.get('Tableau'), 3);
  assert.equal(counts.get('Claude'), 1);
  assert.equal(counts.get('Excel'), 1);
  assert.equal(counts.get('ChatGPT'), 1);
});
