const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
test('Week 9 home uses the Tokyo route comparison and links to its agenda', async () => {
 const html=fs.readFileSync('index.html','utf8');
 assert.match(html,/class="tokyo-hero" href="agenda.html#week-9"/);
 assert.match(html,/data-this-week href="agenda.html#week-9"/);
 assert.match(html,/One question\.<\/span><span>One graphic\./);
 assert.match(html,/WEEK 9/);
 assert.doesNotMatch(html,/xaviz-hero|WEEK 8/);
 assert.match(html,/lecture\/week09-tokyo-commute-map\.webp/);
 const {geographicPaths,tokyoBasemap}=await import('../assets/week09-tokyo-geography.mjs');
 assert.ok(fs.statSync(tokyoBasemap).size>10000);
 assert.deepEqual([...html.matchAll(/data-hero-route="([^"]+)"/g)].map(m=>m[1]).sort(),Object.keys(geographicPaths).sort());
 assert.match(html,/type="module" src="assets\/week09-splash\.mjs"/);
 const translations=fs.readFileSync('assets/i18n.js','utf8');
 assert.match(translations,/'Open Week 9 →': '第9週を開く →'/);
 assert.match(translations,/'One question\.': '一つの問い。'/);
});
