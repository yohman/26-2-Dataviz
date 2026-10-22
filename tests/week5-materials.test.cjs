const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

test('activity tabs share a single row at desktop and mobile widths', () => {
  const css = fs.readFileSync('assets/styles.css', 'utf8');
  assert.match(css, /\.activity-tab-list\{[^}]*grid-auto-flow:column;grid-auto-columns:minmax\(0,1fr\)/);
  assert.doesNotMatch(css, /\.activity-tab-list\{[^}]*grid-template-columns:repeat\(2/);
});

test('Week 5 starts open-ended Gemini exploration with just a CSV', () => {
  const context = { document: { addEventListener() {} }, window: {}, URL, URLSearchParams };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('assets/site.js', 'utf8'), context);
  context.source = fs.readFileSync('content/weeks/05-python-history-evidence.md', 'utf8');
  const week = vm.runInContext("parseWeek(source, '05-python-history-evidence.md')", context);
  assert.equal(week.materials.length, 1);
  assert.equal(week.lectureResources.length, 1);
  assert.match(week.lectureResources[0].href, /Nightingale/);
  assert.deepEqual(Array.from(week.activities[0].materials, m => m.href), ['data/datasaurus.csv']);
  assert.equal(week.activities[0].link, 'https://colab.research.google.com/');
  assert.equal(week.activities[1].materials.length, 4);
  assert.equal(week.activities[1].steps.length, 5);
  assert.equal(week.activities[1].steps_ja.length, 5);
  assert.equal(week.activities.length, 3);
  assert.equal(week.activities[2].number, 3);
  assert.match(week.activities[2].text, /groups of four/);
  assert.match(week.activities[2].text, /Activity 2/);
  assert.equal(week.activities[2].steps.length, 3);
  assert.equal(week.activities[2].steps_ja.length, 3);
  assert.match(week.activities[1].steps.join(' '), /USGS|iTunes|Pokemon/);
  assert.match(week.activities[1].text, /not necessarily an artist's complete discography/);
  assert.ok(week.activities[1].steps.every(prompt => prompt.split(/\s+/).length <= 25));
  assert.ok(week.activities[1].steps_ja.every(prompt => prompt.length < 75));
  assert.doesNotMatch(week.activities[1].steps.join(' '), /https?:/);
  assert.ok(week.activities[0].steps.some(step => step.includes('folder icon')));
  assert.ok(week.activities[0].steps.some(step => step.includes('“Load the data.”')));
  assert.ok(week.activities[0].steps_ja.some(step => step.includes('「データを読み込んで」')));
  assert.ok(week.activities[0].steps.some(step => step.includes('Accept and run')));
  assert.ok(week.activities[0].steps_ja.some(step => step.includes('Accept and run')));
  assert.doesNotMatch(week.activities[0].steps.join(' '), /scatter|selected_dataset|x on|y on/);
  context.week = week;
  const html = vm.runInContext('activityTabs(week)', context);
  assert.match(html, /datasaurus\.csv/);
  assert.match(html, /performance-partners\.apple\.com/);
  assert.match(html, /week-5-activity-3-tab/);
  assert.match(html, /week-5-activity-3"/);
});

test('starter notebook is removed from the course and homework', () => {
  const source = fs.readFileSync('content/weeks/05-python-history-evidence.md', 'utf8');
  assert.doesNotMatch(source, /starter notebook|datasaurus-python\.ipynb|入門ノートブック/);
  assert.match(source, /title: Vibe Coding with Python/);
  assert.equal(fs.existsSync('data/datasaurus-python.ipynb'), false);
});

test('Week 5 homework allows any Python workflow and encourages optional sharing', () => {
  const source = fs.readFileSync('content/weeks/05-python-history-evidence.md', 'utf8');
  assert.match(source, /homework: Individually, use Python/);
  assert.match(source, /Go beyond the first chart/);
  assert.match(source, /one or more visualizations/);
  assert.match(source, /what surprised you, what you discovered/);
  assert.match(source, /Gemini, Codex, or another approach/);
  assert.match(source, /encouraged but optional/);
  assert.match(source, /one screenshot \(required\), with an optional second screenshot/);
  assert.match(source, /共有リンクも歓迎（任意）/);
});
