import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {safeDeckReturn,studioDeckOpening} from '../assets/html-lecture-model.mjs';
import {fifaEvidence,renderWeek9} from '../assets/week09-visuals.mjs';
import {fifaSnapshot} from '../assets/week09-fifa-data.mjs';
import {tubeBreakEven,tubeJourney,tubeRaceFrame,tubeTimeline,tubeUrls} from '../assets/week09-tube.mjs';
import {tubeStations} from '../assets/week09-tube-data.mjs';

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
  assert.deepEqual(deck.slides.slice(0,15).map(slide=>slide.id),['pocket-map','beck-map','train-or-walk','tfl-walking-map','walking-map','tokyo-geography','tokyo-schematic','tokyo-connection','tokyo-reveal','iceland-2018','cabo-verde-2026','fifa-drafts','fifa-missing','title-example','fifa-evidence']);
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
    assert.match(combined,/w9-tube-race-rail/);
    assert.match(combined,/w9-tube-race-walk/);
    assert.match(combined,ja?/私たちの改訂案/:/Our proposed redesign/);
    assert.match(combined,ja?/≈ 3分/:/≈ 3 min/);
    assert.match(combined,/w9-tube-race-extra/);
    assert.match(combined,/type="range" min="0" max="5" value="3"/);
    assert.match(combined,/data-map-route="walk"/);
    assert.match(combined,/data-map-route="rail"/);
    assert.match(combined,/data-tube-play/);
    assert.match(combined,/data-chart-rail/);
    const missing=renderWeek9(deck.slides.find(s=>s.id==='fifa-missing'),{ja});
    assert.match(missing,/week09-fifa-axis-detail\.webp/);
    assert.match(missing,ja?/100万人未満.*約300万人/:/under 1 million.*about 3 million/);
    assert.match(combined,/www\.openstreetmap\.org\/copyright/);
  }
  const streetMap=fs.readFileSync(deck.slides[4].image,'utf8');
  assert.match(streetMap,/#141823/);
  assert.match(streetMap,/opacity="\.22"/);
  assert.deepEqual(deck.slides.map((slide,i)=>slide.annotationPage??i+1).sort((a,b)=>a-b),[1,2,...Array.from({length:20},(_,i)=>i+4)]);
  assert.deepEqual(deck.slides.filter(slide=>slide.kind==='activity').map(slide=>slide.duration),[20,20,40]);
  assert.deepEqual(deck.slides.slice(15,18).map(slide=>slide.id),['design-task','viewer-test','one-change']);
  const example=renderWeek9(deck.slides.find(s=>s.id==='title-example'),{ja:false});
  assert.match(example,/more likely to make FIFA’s top 50\?/);
  assert.doesNotMatch(example,/8 of 101|39 of 102/);
  assert.match(deck.slides.find(s=>s.id==='fifa-evidence').notes.en,/1\. Question[\s\S]+2\. Marks and measures[\s\S]+3\. Labels[\s\S]+4\. Rationale[\s\S]+5\. Insight/);
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

test('Tokyo uses the photographic evidence and reveals the planning allowance after the question',()=>{
  for(const id of ['tokyo-geography','tokyo-reveal']){
    const slide=deck.slides.find(s=>s.id===id);
    assert.ok(fs.statSync(slide.image).size>10000);
  }
  for(const ja of [true,false]){
    const prompt=renderWeek9(deck.slides.find(s=>s.id==='tokyo-connection'),{ja});
    const reveal=renderWeek9(deck.slides.find(s=>s.id==='tokyo-reveal'),{ja});
    assert.match(prompt,ja?/10 <small>分|間に合う/:/10 <small>min|Will you make it/);
    assert.match(reveal,ja?/20 <small>分/:/20 <small>min/);
    assert.match(reveal,ja?/地下4階/:/platform · B4/);
    assert.match(reveal,/jreast\.co\.jp.*1039\.html/);
    assert.match(reveal,/CC BY-SA 4\.0/);
  }
});

test('the replay puts station holds before and after the train movement on the shared clock',()=>{
  assert.deepEqual(tubeRaceFrame(4,1,3,1),{
    walkProgress:.25,railProgress:0,walkTime:1,railTime:1,waiting:true,duration:4
  });
  assert.equal(tubeRaceFrame(4,1,3,2).railProgress,.5);
  assert.equal(tubeRaceFrame(4,1,3,2).waiting,false);
  assert.equal(tubeRaceFrame(4,1,3,3).railProgress,1);
  assert.equal(tubeRaceFrame(4,1,3,3).waiting,true);
  assert.equal(tubeRaceFrame(4,1,3,4).waiting,false);
  assert.equal(tubeRaceFrame(4,1,0,1).railTime,1);
  assert.equal(tubeRaceFrame(4,1,5,5).walkTime,4);
  assert.equal(tubeRaceFrame(4,1,5,5).duration,6);
});

test('Tube comparison keeps the time allowance separate from measured time',()=>{
  assert.equal(tubeBreakEven(4,1),3);
  assert.equal(tubeBreakEven(4,4),0);
  assert.equal(tubeBreakEven(4,5),-1);
  assert.equal(tubeBreakEven(undefined,5),null);
  assert.match(tubeTimeline({walk:{minutes:4},rail:{minutes:7}},false),/Walking has the edge/);
  const sample={walk:{minutes:4},rail:{minutes:1}};
  assert.doesNotMatch(tubeTimeline(sample,false,0),/w9-tube-race-extra/);
  assert.notEqual(tubeTimeline(sample,false,2),tubeTimeline(sample,false,4));
  assert.match(tubeTimeline({walk:null,rail:{minutes:7}},false),/No comparison yet/);
  assert.ok(tubeStations.length>250);
  assert.equal(tubeUrls('x','940GZZLUCGN'),null);
  assert.equal(tubeUrls('940GZZLUCGN','940GZZLUCGN'),null);
  const [walk,rail]=tubeUrls('940GZZLULSQ','940GZZLUCGN');
  assert.match(walk,/51\.511386.*mode=walking/);
  assert.match(rail,/940GZZLULSQ\/to\/940GZZLUCGN\?mode=tube/);
  const geometry={lineString:'[[51.5113,-0.12],[51.512,-0.13]]'};
  const payload={journeys:[{duration:6,legs:[{mode:{id:'walking'},path:geometry}]},{duration:1,legs:[{mode:{id:'tube'},path:geometry}]}]};
  assert.equal(tubeJourney(payload,'walking').minutes,6);
  assert.equal(tubeJourney(payload,'tube').minutes,1);
  assert.equal(tubeJourney({journeys:[payload.journeys[0]]},'tube'),null);
});

test('FIFA evidence uses the dated Group 6 data and appears after the question',()=>{
  assert.equal(fifaSnapshot.rankingDate,'2026-10-07');
  assert.deepEqual(fifaEvidence().halves,[{teams:101,top:8},{teams:102,top:39}]);
  assert.match(renderWeek9(deck.slides.find(s=>s.id==='fifa-evidence'),{ja:false}),/8 of 101 teams[\s\S]+39 of 102 teams/);
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
