const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const context = { document: { addEventListener() {} }, window: {}, URL, URLSearchParams };
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

test('Week 4 lecture examples stay separate from activity materials and open externally', () => {
  context.source = fs.readFileSync(path.join(__dirname, '../content/weeks/04-find-the-unexpected.md'), 'utf8');
  const week = vm.runInContext('parseWeek(source, "week4")', context);
  assert.equal(week.lectureExamples.length, 1);
  assert.equal(week.lectureExamples[0].href, 'https://public.tableau.com/app/discover/trending');
  assert(!week.materials.some(item => item.href.startsWith('https://public.tableau.com/')));
  context.exampleMaterials = week.lectureExamples;
  const html = vm.runInContext('materialLinks(exampleMaterials, { week: 4 })', context);
  assert.equal((html.match(/target="_blank"/g) || []).length, 1);
  assert.equal((html.match(/rel="noopener"/g) || []).length, 1);
  assert(!html.includes('download'));
});

test('Weeks 4 and 5 separate the Tableau challenge from Python and Datasaurus', () => {
  const load = name => {
    context.source = fs.readFileSync(path.join(__dirname, '../content/weeks', name), 'utf8');
    return vm.runInContext(`parseWeek(source, ${JSON.stringify(name)})`, context);
  };
  const four = load('04-find-the-unexpected.md');
  const five = load('05-python-history-evidence.md');
  assert.equal(four.activities.length, 2);
  assert.equal(five.activities.length, 2);
  assert(four.materials.some(m => m.href === 'data/pokemon-review.csv'));
  assert(!four.materials.some(m => /datasaurus|ipynb/.test(m.href)));
  assert(four.materials.some(m => m.href === 'lectures/w04-visual-language.pdf'));
  assert.match(four.homework, /own Tableau project/);
  assert.match(four.requirements, /one screenshot/);
  assert.equal(four.activities[0].title, 'Pokémon Challenge');
  assert.match(four.activities[0].steps[0], /15 minutes/);
  assert.equal(four.activities[0].link, 'activity-submit.html?week=4');
  assert.equal(four.activities[0].results_link, 'activity-results.html?week=4');
  assert.equal(four.activities[1].link, 'gallery.html?week=3');
  assert.match(four.requirements, /Tableau Public visualization URL/);
  assert(four.materials.some(m => m.href === 'pokemon-variables.html'));
  context.groupLink = 'https://example.org/?title=%E7%AC%AC4%E9%80%B1';
  assert.equal(new URL(vm.runInContext('safeResourceHref(groupLink)', context)).searchParams.get('title'), '第4週');
  assert(five.materials.some(m => m.href === 'data/datasaurus-python.ipynb'));
  assert(five.materials.some(m => m.href === 'data/datasaurus.csv'));
  assert(five.materials.some(m => m.href === 'lectures/w05-python-datasaurus.pdf'));
  assert(!four.look.includes('Nightingale'));
  assert(five.look.includes('Nightingale'));
  assert(five.materials.some(m => /Nightingale-mortality/.test(m.href)));
  for (const week of [four, five]) {
    const duration = schedule => schedule.split(';').reduce((total, step) => {
      const times = step.split('|')[0].match(/\d\d:\d\d/g).map(t => Number(t.slice(0, 2))*60 + Number(t.slice(3)));
      return total + times[1] - times[0];
    }, 0);
    assert.equal(duration(week.schedule), 100);
    assert.equal(duration(week.schedule_ja), 100);
  }
});

test('weekly content opens on the calendar day before class, including month boundaries', () => {
  assert.equal(vm.runInContext("availabilityDate('2026-09-25')", context), '2026-09-24');
  assert.equal(vm.runInContext("availabilityDate('2026-10-02')", context), '2026-10-01');
  assert.equal(vm.runInContext("availabilityDate('2027-01-01')", context), '2026-12-31');
});

test('Week 1 homework defines its data link and screenshot deliverables in both languages', () => {
  const source = fs.readFileSync(path.join(__dirname, '../content/weeks/01-why-visualize.md'), 'utf8');
  context.source = source;
  const week = vm.runInContext("parseWeek(source, '01-why-visualize.md')", context);
  assert.match(week.deliverables, /Google Sheets or Google Docs/);
  assert.match(week.deliverables, /screenshot/);
  assert.match(week.deliverables_ja, /Googleスプレッドシート/);
});

test('homework closes at 11:59 PM JST before the next actual class', () => {
  const deadline = vm.runInContext("submissionDeadlineMs('2026-10-02')", context);
  assert.equal(new Date(deadline).toISOString(), '2026-10-01T14:59:00.000Z');
  context.deadline = deadline;
  assert.equal(vm.runInContext('submissionIsOpen(deadline, deadline - 1)', context), true);
  assert.equal(vm.runInContext('submissionIsOpen(deadline, deadline)', context), false);
});
