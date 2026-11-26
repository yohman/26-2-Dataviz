import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {safeDeckReturn,studioDeckOpening} from '../assets/html-lecture-model.mjs';
import {fifaEvidence,renderWeek9} from '../assets/week09-visuals.mjs';
import {fifaSnapshot} from '../assets/week09-fifa-data.mjs';

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
  assert.deepEqual(deck.slides.slice(0,11).map(slide=>slide.id),['pocket-map','beck-map','train-or-walk','tfl-walking-map','walking-map','iceland-2018','cabo-verde-2026','fifa-drafts','fifa-missing','title-example','fifa-evidence']);
  for (const slide of deck.slides) for (const ja of [true,false]) {
    assert.ok(slide.notes[ja?'ja':'en']);
    const html=renderWeek9(slide,{ja});
    assert.ok(html.length>80,`Missing slide: ${slide.id}`);
    if(slide.kind==='archive') assert.match(html,/<img src="(?:https:|assets\/images\/lecture\/week09-2025\/).*alt="[^"]+"/);
  }
  for(const ja of [true,false]){
    const tfl=renderWeek9(deck.slides[3],{ja});
    assert.match(tfl,/week09-tfl-west-end\.webp/);
    assert.match(tfl,/320 m/);
    const combined=renderWeek9(deck.slides[4],{ja});
    assert.match(combined,/w9-geographic-map/);
    assert.match(combined,/w9-rail-time/);
    assert.match(combined,/w9-walk-time/);
    assert.match(combined,ja?/約3分/:/~3 min/);
    assert.match(combined,/www\.openstreetmap\.org\/copyright/);
  }
  const streetMap=fs.readFileSync(deck.slides[4].image,'utf8');
  assert.match(streetMap,/#273e80.*stroke-dasharray="12 12"/);
  assert.match(streetMap,/#9b343f.*stroke-width="10"/);
  assert.deepEqual(deck.slides.map((slide,i)=>slide.annotationPage??i+1).sort((a,b)=>a-b),[1,2,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]);
  assert.deepEqual(deck.slides.filter(slide=>slide.kind==='activity').map(slide=>slide.duration),[20,20,40]);
  assert.deepEqual(deck.slides.slice(11,14).map(slide=>slide.id),['design-task','viewer-test','one-change']);
  const example=renderWeek9(deck.slides[9],{ja:false});
  assert.match(example,/more likely to make FIFA’s top 50\?/);
  assert.doesNotMatch(example,/8 of 101|39 of 102/);
  assert.match(deck.slides[10].notes.en,/1\. Question[\s\S]+2\. Marks and measures[\s\S]+3\. Labels[\s\S]+4\. Rationale[\s\S]+5\. Insight/);
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

test('FIFA evidence uses the dated Group 6 data and appears after the question',()=>{
  assert.equal(fifaSnapshot.rankingDate,'2026-10-07');
  assert.deepEqual(fifaEvidence().halves,[{teams:101,top:8},{teams:102,top:39}]);
  assert.match(renderWeek9(deck.slides[10],{ja:false}),/8 of 101 teams[\s\S]+39 of 102 teams/);
  for(const s of deck.slides){
    for(const path of [s.image,...(s.images||[]).map(i=>i.src)].filter(path=>path?.startsWith('assets/'))){
      assert.ok(fs.statSync(path).size>1000,path);
    }
  }
});

test('the 2025 showcases follow homework and link to the original archive pages',()=>{
  const slides=deck.slides.slice(-3);
  assert.equal(deck.slides.at(-4).id,'homework');
  assert.deepEqual(slides.map(s=>s.credit.en),['Team Snow','Team Tukey','Team Minard']);
  assert.deepEqual(slides.map(s=>new URL(s.sources[0].href,'https://example.test').searchParams.get('page')),['3','4','7']);
  for(const s of slides) assert.ok(fs.statSync(s.image).size>50_000);
});
