const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const context = { document: { addEventListener() {} }, window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/site.js'), 'utf8'), context);

test('each weekly file has an editable Mori corner without changing course content', () => {
  const directory = path.join(__dirname, '../content/weeks');
  const files = fs.readdirSync(directory).filter(name => name.endsWith('.md')).sort();
  assert.equal(files.length, 14);
  for (const file of files) {
    const source = fs.readFileSync(path.join(directory, file), 'utf8');
    context.source = source; context.file = file;
    const week = vm.runInContext('parseWeek(source, file)', context);
    assert.ok(source.includes("## Mori's Corner"), file);
    assert.equal(typeof week.mori.title, 'string', file);
    assert.ok(week.materials.length, file);
  }
});

test('Mori corner supports title, text, link, and a local file', () => {
  const source = "## Mori's Corner\n\ntitle: Try this\ntext_ja: 見てみよう\nlink: https://example.org/\nfile: content/files/handout.pdf\n";
  context.source = source;
  const fields = vm.runInContext('parseMoriCorner(source)', context);
  assert.equal(fields.title, 'Try this');
  assert.equal(fields.text_ja, '見てみよう');
  assert.equal(fields.link, 'https://example.org/');
  assert.equal(fields.file, 'content/files/handout.pdf');
  assert.equal(vm.runInContext("safeResourceHref('content/files/handout.pdf')", context), 'content/files/handout.pdf');
  assert.equal(vm.runInContext("safeResourceHref('content/../private.txt')", context), '');
});

test('weekly content opens on the calendar day before class, including month boundaries', () => {
  assert.equal(vm.runInContext("availabilityDate('2026-09-25')", context), '2026-09-24');
  assert.equal(vm.runInContext("availabilityDate('2026-10-02')", context), '2026-10-01');
  assert.equal(vm.runInContext("availabilityDate('2027-01-01')", context), '2026-12-31');
});
