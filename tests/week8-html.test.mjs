import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {safeDeckReturn} from '../assets/html-lecture-model.mjs';
import {renderWeek8,feedbackChart} from '../assets/week08-visuals.mjs';
const deck=JSON.parse(fs.readFileSync('content/slides/week08.json')),data=JSON.parse(fs.readFileSync('data/week07-examples.json'));
const source=fs.readFileSync('content/weeks/08-share-discuss-build.md','utf8');
const context={document:{addEventListener(){}},window:{},URL,URLSearchParams};vm.createContext(context);vm.runInContext(fs.readFileSync('assets/site.js','utf8'),context);context.source=source;const week=vm.runInContext("parseWeek(source,'08-share-discuss-build.md')",context);
test('Week 8 is entirely native with original source photos, original XAVIZ destination and cumulative Ds',()=>{
 assert.equal(week.materials[0].href,'lecture.html?week=8');
 assert.equal(deck.slides[0].id,'framework');assert.equal(deck.slides[0].kind,'framework-cover');
 assert.equal(new Set(deck.slides.map(s=>s.id)).size,deck.slides.length);
 for(const [i,s] of deck.slides.entries()){
  assert.equal(s.page,i+1);assert.ok(s.title.ja&&s.title.en);assert.ok(s.notes.ja!==undefined&&s.notes.en!==undefined);
  for(const ja of [true,false]){const html=renderWeek8(s,{ja,data,returnTo:'agenda.html#week-8'});assert.ok(html.length>100);assert.doesNotMatch(html,/<(?:iframe|canvas)|\.pdf|week08\.png/);}
 }
 assert.doesNotMatch(JSON.stringify(deck),/Gallery walk|Padlet/);
 const stages=deck.slides.filter(s=>s.kind==='diamond'&&!s.iterate);assert.deepEqual(stages.map(s=>s.phase),[0,1,2,3,4]);
 for(const s of stages){const html=renderWeek8(s,{ja:true,data,returnTo:''});const names=[...html.matchAll(/class="w8-phase-name"[^>]*>([^<]+)/g)].map(m=>m[1]);assert.deepEqual(names,['Discover','Define','Develop','Deliver'].slice(0,s.phase));}
 const x=deck.slides.find(s=>s.id==='xaviz');assert.equal(x.href,'https://docs.google.com/presentation/d/1nzo8jO-YejXe_3wUdZwXTMdqLpY96ang8nzZu2FokTU/edit?usp=sharing');assert.equal(x.notes.ja,'');assert.equal(x.notes.en,'');
 assert.equal(deck.slides.find(s=>s.id==='double-diamond').phase,4);
});
test('chart revision uses the same actual values and labels the sorted result',()=>{
 const html=feedbackChart(data,3,false);const values=[84.2,82.4,79.1,76.9,69.1];let last=-1;
 for(const v of values){const at=html.indexOf(`>${v}</text>`);assert.ok(at>last);last=at;}
 assert.match(html,/Life expectancy · 2018/);
 assert.doesNotMatch(feedbackChart(data,1,false),/>84.2<\/text>/);
});
test('activities link to the complete Double Diamond while timing and opening gate remain intact',()=>{
 assert.equal(week.activities.length,3);assert.equal(week.feedback_loop,'lecture.html?week=8&slide=double-diamond');
 assert.match(source,/opens_at: 2026-11-20T09:00:00\+09:00/);assert.match(week.schedule,/11:05–11:50/);
 assert.equal(safeDeckReturn('agenda.html?p#week-8',8),'agenda.html?p#week-8');
 assert.equal(safeDeckReturn('https://example.com',8),'agenda.html#week-8');
 assert.equal(safeDeckReturn('agenda.html#week-7',8),'agenda.html#week-8');
});
