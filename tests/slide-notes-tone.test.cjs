const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
test('Week 5 notes stay factual and aligned with their editorial source', () => {
  const notes = JSON.parse(fs.readFileSync(path.join(root, 'lectures/w05-python-datasaurus.notes.json'))).slides;
  const source = JSON.parse(fs.readFileSync(path.join(root, 'scripts/week5-factual-notes.json')));
  assert.equal(notes.length, 30);
  notes.forEach((note, i) => {
    assert.deepEqual([note.ja, note.en], source[i]);
    assert.doesNotMatch(note.en, /ask students|introduce .* as|discuss |invite observations|for students|pointing to/i);
    assert.doesNotMatch(note.ja, /学生に|もらう|問いかけ|強調する|話し合う/);
  });
});
