import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {safeDeckReturn} from '../assets/html-lecture-model.mjs';
import {renderWeek8} from '../assets/week08-visuals.mjs';
const deck=JSON.parse(fs.readFileSync('content/slides/week08.json')),data=JSON.parse(fs.readFileSync('data/week07-examples.json'));
const source=fs.readFileSync('content/weeks/08-share-discuss-build.md','utf8');
const context={document:{addEventListener(){}},window:{},URL,URLSearchParams};vm.createContext(context);vm.runInContext(fs.readFileSync('assets/site.js','utf8'),context);context.source=source;const week=vm.runInContext("parseWeek(source,'08-share-discuss-build.md')",context);
test('Week 8 is entirely native with original source photos, original XAVIZ destination and cumulative Ds',()=>{
 assert.equal(week.materials[0].href,'lecture.html?week=8');
 assert.deepEqual(deck.slides.slice(0,3).map(s=>s.id),['xaviz','visual-thinking','framework']);
 assert.equal(deck.slides[2].kind,'framework-cover');
 assert.equal(new Set(deck.slides.map(s=>s.id)).size,deck.slides.length);
 for(const [i,s] of deck.slides.entries()){
  assert.equal(s.page,i+1);assert.ok(s.title.ja&&s.title.en);assert.ok(s.notes.ja!==undefined&&s.notes.en!==undefined);
  for(const ja of [true,false]){const html=renderWeek8(s,{ja,data,returnTo:'agenda.html#week-8'});assert.ok(html.trim());assert.doesNotMatch(html,/<(?:iframe|canvas)|\.pdf|week08\.png/);}
 }
 assert.doesNotMatch(JSON.stringify(deck),/Gallery walk|Padlet/);
 const stages=deck.slides.filter(s=>s.kind==='diamond'&&!s.feedbackCount);assert.deepEqual(stages.map(s=>s.phase),[0,1,2,3,4]);
 for(const s of stages){const html=renderWeek8(s,{ja:true,data,returnTo:''});const names=[...html.matchAll(/class="w8-source-phase-name"[^>]*>([^<]+)/g)].map(m=>m[1]);assert.deepEqual(names,['Discover','Define','Develop','Deliver'].slice(0,s.phase));}
 const x=deck.slides.find(s=>s.id==='xaviz');assert.equal(x.href,'https://docs.google.com/presentation/d/1nzo8jO-YejXe_3wUdZwXTMdqLpY96ang8nzZu2FokTU/edit?usp=sharing');assert.equal(x.notes.ja,'');assert.equal(x.notes.en,'');
 assert.equal(deck.slides.find(s=>s.id==='double-diamond').phase,4);
});
test('four reflection slides advance in order, highlight a phase, and use the Week 4 CSV values',()=>{
 const stages=deck.slides.slice(21,25);
 assert.deepEqual(stages.map(s=>s.stage),['total','challenge','compare','pinup']);
 const csv=fs.readFileSync('data/pokemon-review.csv','utf8').trim().split(/\r?\n/).map(r=>r.split(','));
 const columns={total:'Base_Stat_Total',speed:'Speed',defense:'Defense'};
 for(const [i,s] of stages.entries())for(const ja of [false,true]){
  const html=renderWeek8(s,{ja,data,returnTo:''}),phase=['Discover','Define','Develop','Deliver'][i];
  assert.ok(html.includes(`data-phase="${phase}"`));
  assert.ok(html.includes(`aria-current="step">${phase}</span>`));
  assert.equal((html.match(/class="is-current"/g)||[]).length,1);
  assert.doesNotMatch(html,/<button|<a |↶/);
  const values=[...html.matchAll(/data-pokemon="(\d+)" data-stat="(\w+)"[^>]*>(\d+)</g)];
  assert.equal(values.length,[2,0,4,0][i]);
  for(const [,id,stat,value] of values)assert.equal(value,csv.find(r=>r[0]===id)[csv[0].indexOf(columns[stat])]);
 }
 assert.equal(new Set(deck.slides.map(s=>s.annotationPage??s.page)).size,deck.slides.length);
});
test('activities link to the complete Double Diamond while timing and opening gate remain intact',()=>{
 assert.equal(week.activities.length,3);assert.equal(week.feedback_loop,'lecture.html?week=8&slide=double-diamond');
 assert.match(source,/opens_at: 2026-11-20T09:00:00\+09:00/);assert.match(week.schedule,/11:05–11:50/);
 assert.equal(safeDeckReturn('agenda.html?p#week-8',8),'agenda.html?p#week-8');
 assert.equal(safeDeckReturn('https://example.com',8),'agenda.html#week-8');
 assert.equal(safeDeckReturn('agenda.html#week-7',8),'agenda.html#week-8');
});

test('the A3 handoff is one printout per group, followed by pin-up, critique and revision',()=>{
 assert.match(week.requirements,/A3.*297.*420/);assert.match(week.requirements,/November 27/);assert.match(week.requirements_ja,/A3.*1枚/);
 assert.match(week.requirements,/Each person submits 1–2 images/);
 const hw=deck.slides.find(s=>s.id==='homework');assert.match(hw.steps.en[0],/one A3|One A3/);assert.match(hw.notes.en,/one per group/);
 const src=fs.readFileSync('content/weeks/09-studio-test-improve.md','utf8');context.source=src;const next=vm.runInContext("parseWeek(source,'09-studio-test-improve.md')",context);
 assert.equal(next.activities.length,3);assert.match(next.activities[0].text,/one A3/);assert.match(next.activities[1].text,/at least two/);assert.match(next.activities[2].text,/improve your prototype/);assert.doesNotMatch(src,/Padlet/);
 const final=renderWeek8(deck.slides.find(s=>s.id==='double-diamond'),{ja:true,data,returnTo:''});assert.doesNotMatch(final,/w8-source-feedback/);assert.doesNotMatch(final,/w8-phase.*polygon/);assert.equal((final.match(/w8-source-phase-name/g)||[]).length,4);
 assert.ok(deck.slides.find(s=>s.kind==='framework-context').sources.some(s=>s.label.includes('CC BY 4.0')));
});
