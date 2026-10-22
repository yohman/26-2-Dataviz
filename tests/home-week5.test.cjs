const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
test('home hero shows Nightingale and opens Week 5', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.match(html, /history-map-trigger" href="agenda.html#week-5"/);
  assert.match(html, /nightingale-hero\.png/);
  assert.match(html, /WEEK 5 · EXPLORATION/);
  assert.doesNotMatch(html, /pikachu\.png|WEEK 4/);
  assert.ok(fs.statSync('assets/images/lecture/nightingale-hero.png').size > 0);
});
