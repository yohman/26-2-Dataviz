import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {safeDeckReturn,studioDeckOpening} from '../assets/html-lecture-model.mjs';
import {renderWeek9} from '../assets/week09-visuals.mjs';

const path='content/weeks/09-studio-test-improve.md';
const source=fs.readFileSync(path,'utf8');
const deck=JSON.parse(fs.readFileSync('content/slides/week09.json','utf8'));

test('Week 9 shares the agenda opening time and preserves the preview return',()=>{
  assert.equal(studioDeckOpening(source),Date.parse('2026-11-27T10:00:00+09:00'));
  assert.ok(Number.isNaN(studioDeckOpening(source.replace('opens_at:','course_time:'))));
  assert.equal(safeDeckReturn('agenda.html?p#week-9',9),'agenda.html?p#week-9');
  assert.equal(safeDeckReturn('https://example.test/agenda.html?p#week-9',9),'agenda.html#week-9');
  const context=vm.createContext({document:{addEventListener(){}},window:{},URL,URLSearchParams});
  vm.runInContext(fs.readFileSync('assets/site.js','utf8'),context);
  const html=vm.runInContext(`materialLinks([{label:'Lecture slides',href:'lecture.html?week=9',type:'slides'}],{week:9,returnTo:'agenda.html?p#week-9'})`,context);
  assert.match(html,/lecture\.html\?week=9&amp;return=agenda\.html%3Fp%23week-9/);
});

test('historical sources, bilingual slides, chapters and homework render in the agreed order',()=>{
  assert.deepEqual(deck.slides.slice(0,4).map(slide=>slide.id),['pocket-map','beck-map','train-or-walk','walking-map']);
  for (const slide of deck.slides) for (const ja of [true,false]) {
    assert.ok(slide.notes[ja?'ja':'en']);
    const html=renderWeek9(slide,{ja});
    assert.ok(html.length>80,`Missing slide: ${slide.id}`);
    if(slide.kind==='archive') assert.match(html,/<img src="(?:https:|assets\/images\/lecture\/week09-2025\/).*alt="[^"]+"/);
  }
  for(const ja of [true,false]){
    const combined=renderWeek9(deck.slides[3],{ja});
    assert.match(combined,/w9-geographic-map/);
    assert.match(combined,/w9-rail-time/);
    assert.match(combined,/w9-walk-time/);
    assert.match(combined,/380 m/);
    assert.match(combined,/www\.openstreetmap\.org\/copyright/);
  }
  const streetMap=fs.readFileSync(deck.slides[3].image,'utf8');
  assert.match(streetMap,/#273e80.*stroke-dasharray="12 12"/);
  assert.match(streetMap,/#9b343f.*stroke-width="10"/);
  assert.deepEqual(deck.slides.map((slide,i)=>slide.annotationPage??i+1).sort((a,b)=>a-b),[1,2,4,5,6,7,8,9,10,11,12,13]);
  assert.deepEqual(deck.slides.filter(slide=>slide.kind==='activity').map(slide=>slide.duration),[20,20,40]);
  assert.deepEqual(deck.slides.slice(4,8).map(slide=>slide.id),['title-example','design-task','viewer-test','one-change']);
  const example=renderWeek9(deck.slides[4],{ja:false});
  assert.match(example,/FIFA rankings<\/p><h1>Do countries with more people rank higher in football\?/);
  assert.match(deck.slides[4].notes.en,/1\. Question[\s\S]+2\. Visual choices and data[\s\S]+3\. Titles and labels[\s\S]+4\. Reason for the design[\s\S]+5\. Original insight/);
  assert.doesNotMatch(source+JSON.stringify(deck),/MIT 6\.894|vis\.mit\.edu/i);
  for (const chapter of deck.chapters) assert.ok(deck.slides.some(slide=>slide.id===chapter.id));
  assert.match(renderWeek9(deck.slides.find(s=>s.id==='homework'),{ja:false}),/homework-submit\.html\?week=9/);
  assert.match(source,/One person submits for the group/);
  assert.match(source,/3–5 sentences/);
  assert.match(source,/first group draft/);
  const submission=fs.readFileSync('assets/homework-submissions.js','utf8');
  assert.match(submission,/Your question title/);
  assert.match(submission,/First group draft/);
});

test('the 2025 showcases follow homework and link to the original archive pages',()=>{
  const slides=deck.slides.slice(-3);
  assert.equal(deck.slides.at(-4).id,'homework');
  assert.deepEqual(slides.map(s=>s.credit.en),['Team Snow','Team Tukey','Team Minard']);
  assert.deepEqual(slides.map(s=>new URL(s.sources[0].href,'https://example.test').searchParams.get('page')),['3','4','7']);
  for(const s of slides) assert.ok(fs.statSync(s.image).size>50_000);
});
