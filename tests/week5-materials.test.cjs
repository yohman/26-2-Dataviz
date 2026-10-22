const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

test('Week 5 routes the two required files only to Activity 1', () => {
  const context = { document: { addEventListener() {} }, window: {}, URL, URLSearchParams };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('assets/site.js', 'utf8'), context);
  context.source = fs.readFileSync('content/weeks/05-python-history-evidence.md', 'utf8');
  const week = vm.runInContext("parseWeek(source, '05-python-history-evidence.md')", context);
  assert.equal(week.materials.length, 1);
  assert.equal(week.lectureResources.length, 1);
  assert.match(week.lectureResources[0].href, /Nightingale/);
  assert.deepEqual(Array.from(week.activities[0].materials, m => m.href), ['data/datasaurus-python.ipynb', 'data/datasaurus.csv']);
  assert.equal(week.activities[0].link, 'https://colab.research.google.com/');
  assert.equal(week.activities[1].materials.length, 3);
  assert.ok(week.activities[0].steps.some(step => step.includes('Upload notebook')));
  assert.ok(week.activities[0].steps_ja.some(step => step.includes('Shift+Enter')));
  context.week = week;
  const html = vm.runInContext('activityTabs(week)', context);
  assert.match(html, /datasaurus\.csv/);
  assert.match(html, /data\/anscombe\.csv/);
});

test('starter notebook uses the uploaded file', () => {
  const notebook = JSON.parse(fs.readFileSync('data/datasaurus-python.ipynb', 'utf8'));
  const code = notebook.cells.filter(cell => cell.cell_type === 'code').map(cell => cell.source.join('')).join('\n');
  assert.match(code, /pd\.read_csv\('datasaurus\.csv'\)/);
  assert.doesNotMatch(code, /raw\.githubusercontent/);
});
