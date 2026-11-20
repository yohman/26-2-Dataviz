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
test('Du Bois reflection moves from data to a city draft, the share, and the finished plate',()=>{
 const stages=deck.slides.slice(14,18);
 assert.equal(deck.slides[13].id,'schon');
 assert.equal(deck.slides[18].id,'visual-thinking-with-ai');
 assert.equal(deck.slides.slice(19,25).filter(s=>s.kind==='seam-preview').length,6);
 assert.ok(!deck.slides.some(s=>s.id==='who-is-missing'));
 const chapters=deck.chapters.map(c=>c.id);
 assert.ok(chapters.indexOf('make-critique-revise')<chapters.indexOf('visual-thinking-with-ai'));
 assert.deepEqual(stages.map(s=>s.stage),['data','draft','reveal','deliver']);
 for(const [i,s] of stages.entries())for(const ja of [false,true]){
  const html=renderWeek8(s,{ja,data,returnTo:''}),phase=['Discover','Define','Develop','Deliver'][i];
  assert.ok(html.includes(`data-phase="${phase}"`));
  assert.ok(html.includes(`aria-current="step">${phase}</span>`));
  assert.equal((html.match(/class="is-current"/g)||[]).length,1);
  assert.doesNotMatch(html,/<button|<a |↶/);
  const values=[...html.matchAll(/data-count="(\d+)"/g)].map(m=>Number(m[1]));
  assert.deepEqual(values,[[78139,8025,37699,734952],[78139,8025,37699],[123863,734952],[]][i]);
  assert.ok(s.sources.some(link=>link.href==='https://www.loc.gov/item/2013650430/'));
  if(i===0)assert.match(html,/<table>/);
  if(i===1)for(const color of ['#536c5c','#5b70a9','#e4b126'])assert.ok(html.includes(`fill="${color}"`));
  if(i===2){
   assert.ok(html.includes(`${(734952/858815*100).toFixed(1)}%`));
   assert.match(html,/--plate-green:#536c5c;--plate-red:#be3a4c/);
   assert.doesNotMatch(html,/<img/);
  }
  if(i!==2)assert.doesNotMatch(html,/85\.6%/);
  if(i===3)assert.match(html,/<figure class="w8-dubois-plate"><img src="assets\/images\/week06\/city-rural.jpg" width="1751" height="2200"[^>]*draggable="false"/);
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

test('Week 8 is an individual revision and the A3 poster belongs to the Week 9 group critique',()=>{
 assert.doesNotMatch(source,/A3/);assert.doesNotMatch(JSON.stringify(deck),/\bA3\b/);
 assert.match(week.homework,/show-and-tell.*own visualizations.*Each student/);
 assert.match(week.requirements,/one image of your revised graphic/);assert.match(week.requirements_ja,/改訂した可視化の画像1枚/);
 const hw=deck.slides.find(s=>s.id==='homework');assert.match(hw.steps.en[0],/your own graphic.*show-and-tell/);assert.match(hw.notes.en,/November 26, 2026 at 23:59 JST/);
 assert.match(renderWeek8(hw,{ja:false,data,returnTo:''}),/homework-submit\.html\?week=8/);
 const src=fs.readFileSync('content/weeks/09-studio-test-improve.md','utf8');context.source=src;const next=vm.runInContext("parseWeek(source,'09-studio-test-improve.md')",context);
 assert.equal(next.activities.length,3);assert.match(next.activities[0].text,/Week 9 group deliverable.*one printed A3.*November 27/);assert.match(next.activities[0].text_ja,/第9週のグループ提出物.*A3.*1枚/);assert.match(next.activities[1].text,/at least two/);assert.match(next.activities[2].text,/improve your prototype/);assert.doesNotMatch(src,/Padlet/);
 const final=renderWeek8(deck.slides.find(s=>s.id==='double-diamond'),{ja:true,data,returnTo:''});assert.doesNotMatch(final,/w8-source-feedback/);assert.doesNotMatch(final,/w8-phase.*polygon/);assert.equal((final.match(/w8-source-phase-name/g)||[]).length,4);
 assert.ok(deck.slides.find(s=>s.kind==='framework-context').sources.some(s=>s.label.includes('CC BY 4.0')));
});
