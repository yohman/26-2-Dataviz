const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
test('home hero shows Du Bois and opens Week 6', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.match(html, /history-map-trigger" href="agenda.html\?v=dubois-homework-20261106#week-6"/);
  assert.match(html, /week06\/dubois-portrait\.png/);
  assert.match(html, /WEEK 6 · SOCIAL JUSTICE/);
  assert.doesNotMatch(html, /nightingale-hero\.png|WEEK 5/);
  assert.ok(fs.statSync('assets/images/week06/dubois-portrait.png').size > 0);
});
