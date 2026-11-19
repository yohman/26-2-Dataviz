const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
test('Week 8 home uses XAVIZ artwork, a title only, and links to its agenda', () => {
 const html=fs.readFileSync('index.html','utf8');
 assert.match(html,/history-map-trigger" href="agenda.html#week-8"/);
 assert.match(html,/lecture\/xaviz-hero\.jpg/);
 assert.match(html,/<h1>XAVIZ<\/h1>/);
 assert.match(html,/WEEK 8/);
 assert.doesNotMatch(html,/student-wall-hero|data-gallery-source|history-author/);
 assert.ok(fs.statSync('assets/images/lecture/xaviz-hero.jpg').size>10000);
 const translations=fs.readFileSync('assets/i18n.js','utf8');
 assert.match(translations,/'Open Week 8 →': '第8週を開く →'/);
});
