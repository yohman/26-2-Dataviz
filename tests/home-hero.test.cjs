const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
test('Week 7 home uses the actual student image-wall capture and opens its agenda', () => {
 const html=fs.readFileSync('index.html','utf8');
 assert.match(html,/history-map-trigger" href="agenda.html#week-7"/);
 assert.match(html,/week07\/student-gallery-wall\.jpg/);
 assert.match(html,/data-gallery-source="gallery.html\?week=6&amp;view=wall"/);
 assert.match(html,/WEEK 7 · GROUP PROJECT/);
 assert.doesNotMatch(html,/dubois-portrait|WEEK 6 · SOCIAL JUSTICE|nightingale-hero/);
 assert.ok(fs.statSync('assets/images/week07/student-gallery-wall.jpg').size>10000);
 const translations=fs.readFileSync('assets/i18n.js','utf8');
 assert.match(translations,/'Choose a shared dataset': '共有データセットを選ぶ'/);
 assert.match(translations,/'Student work · Week 6': '学生の作品 · 第6週'/);
});
