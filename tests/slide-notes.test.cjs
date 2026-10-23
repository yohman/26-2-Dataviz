const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const payload = JSON.parse(fs.readFileSync('lectures/w05-python-datasaurus.notes.json', 'utf8'));
function fixture(fetcher) {
  const nodes = new Map(['[data-notes-heading]', '[data-notes-text]', '[data-notes-sources]'].map(key => [key, {
    textContent: '', hidden: false, open: false, children: [],
    replaceChildren() { this.children = []; }, append(node) { this.children.push(node); }
  }]));
  const root = { hidden: true, querySelector: key => nodes.get(key), ownerDocument: { createElement: () => ({}) } };
  const window = { fetch: fetcher };
  vm.runInNewContext(fs.readFileSync('assets/slide-notes.js', 'utf8'), { window, URL });
  return { root, nodes, create: window.createSlideNotes };
}
test('all 32 revised slides retain aligned bilingual notes', () => {
  assert.equal(payload.slides.length, 32);
  payload.slides.forEach((slide, index) => {
    assert.equal(slide.page, index + 1);
    assert.ok(slide.ja && slide.en && typeof slide.originalText === 'string');
  });
  assert.equal(payload.slides[29].title, 'ColabにCSVをアップロード');
  assert.equal(payload.slides[21].title, 'Exploratory Data Analysis');
  assert.equal(payload.slides[22].title, 'EDA workflow');
  assert.equal(payload.slides[23].title, '要約で消える形');
  assert.equal(payload.slides[30].title, 'Colab × Gemini');
  assert.equal(payload.slides[28].title, '具体的な依頼と曖昧な依頼');
  assert.match(payload.slides[20].ja, /Princeton/);
  assert.equal(payload.slides[7].title, 'England and Her Soldiers');
  assert.equal(payload.slides[10].title, '面積と色の説明');
  assert.equal(payload.slides[11].title, '面積と色の説明 · 1');
  assert.equal(payload.slides[12].title, '面積と色の説明 · 2');
});
test('viewer exposes revised notes only, with no original-text disclosure', () => {
  const html = fs.readFileSync('viewer.html', 'utf8');
  const script = fs.readFileSync('assets/slide-notes.js', 'utf8');
  assert.doesNotMatch(html + script, /data-notes-original|Original slide text|元スライドの説明/);
});
test('notes follow page changes and JP/EN without refetching', async () => {
  let calls = 0, language = 'ja';
  const f = fixture(async () => { calls++; return { ok: true, json: async () => payload }; });
  const notes = f.create({ root: f.root, file: payload.file, page: 27, language: () => language });
  await notes.ready;
  assert.equal(f.nodes.get('[data-notes-text]').textContent, payload.slides[26].ja);
  language = 'en'; notes.render();
  assert.equal(f.nodes.get('[data-notes-text]').textContent, payload.slides[26].en);
  notes.setPage(31);
  assert.match(f.nodes.get('[data-notes-text]').textContent, /Accept and run/);
  assert.equal(calls, 1);
  assert.equal(f.root.hidden, false);
});
test('notes failures resolve to a message; unrelated decks do not fetch notes', async () => {
  const f = fixture(async () => { throw new Error('offline'); });
  await f.create({ root: f.root, file: payload.file, language: () => 'en' }).ready;
  assert.match(f.nodes.get('[data-notes-text]').textContent, /Could not load/);
  const other = fixture(() => { throw new Error('should not fetch'); });
  await other.create({ root: other.root, file: 'lectures/w04-visual-language.pdf', language: () => 'ja' }).ready;
  assert.equal(other.root.hidden, true);
});
test('viewer keeps notes below the PDF section and updates them on navigation', () => {
  const html = fs.readFileSync('viewer.html', 'utf8');
  assert.ok(html.indexOf('data-slide-notes') > html.indexOf('</section>'));
  assert.match(html, /slideNotes\.setPage\(activePage\)/);
  assert.match(html, /slideNotes\.render\(\)/);
});
