import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {safeDeckReturn,studioDeckOpening} from '../assets/html-lecture-model.mjs';
import {fifaEvidence,renderWeek9} from '../assets/week09-visuals.mjs';
import {fifaSnapshot} from '../assets/week09-fifa-data.mjs';
import {tubeBreakEven,tubeJourney,tubeRaceFrame,tubeTimeline,tubeUrls} from '../assets/week09-tube.mjs';
import {tubeStations} from '../assets/week09-tube-data.mjs';
import {tokyoTimes,tokyoRace,tokyoFrame,tokyoMapFrame} from '../assets/week09-tokyo-race.mjs';
import {geographicPaths,geographicStops,tokyoBasemap} from '../assets/week09-tokyo-geography.mjs';

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
    assert.match(missing,/week09-fifa-scatter\.webp/);
    assert.match(missing,ja?/100万人未満.*約300万人/:/under 1 million.*about 3 million/);
    assert.match(combined,/www\.openstreetmap\.org\/copyright/);
  }
  const streetMap=fs.readFileSync(deck.slides[4].image,'utf8');
  assert.match(streetMap,/#141823/);
  assert.match(streetMap,/opacity="\.22"/);
  assert.deepEqual(deck.slides.map((slide,i)=>slide.annotationPage??i+1).sort((a,b)=>a-b),[1,2,4,5,6,7,8,9,10,14,15,16,17,18,19,24,25,26,27,28,29]);
  assert.deepEqual(deck.slides.filter(slide=>slide.kind==='activity').map(slide=>slide.duration),[25,20,35]);
  assert.deepEqual(deck.slides.slice(15,20).map(slide=>slide.id),['studio-opening','studio-seating','design-task','viewer-test','one-change']);
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

test('Tokyo opens with the real planner summary and stages the same-train race in both languages',()=>{
  const lead=deck.slides.find(s=>s.id==='tokyo-geography');
  assert.ok(fs.statSync(lead.image).size>10000);
  for(const ja of [true,false]){
    assert.match(renderWeek9(lead,{ja}),/transit\.yahoo\.co\.jp/);
    assert.match(renderWeek9(lead,{ja}),ja?/1班・3つの案/:/One team, three drafts/);
    assert.match(renderWeek9(deck.slides.find(s=>s.id==='tokyo-schematic'),{ja}),/data-path="shared" d="M486 86 L353 159/);
    assert.match(renderWeek9(deck.slides.find(s=>s.id==='tokyo-schematic'),{ja}),ja?/案 B/:/Draft B/);
    const clockDraft=renderWeek9(deck.slides.find(s=>s.id==='tokyo-connection'),{ja});
    assert.match(clockDraft,ja?/案 C/:/Draft C/);
    assert.match(clockDraft,/09:38[\s\S]*09:45[\s\S]*09:03/);
    const model=renderWeek9(deck.slides.find(s=>s.id==='tokyo-reveal'),{ja});
    assert.match(model,ja?/経路＋地図＋時間軸/:/Route options \+ map \+ shared clock/);
    assert.match(model,/data-tokyo-play/);
    assert.match(model,/data-tokyo-scrub min="0" max="58" step="0.25" value="0" aria-valuetext="09:03"/);
    assert.match(model,/data-tokyo-walk-input min="4" max="16"/);
    assert.match(model,/week09-tokyo-commute-map\.webp/);
    assert.match(model,/data-tokyo-camera[^>]+viewBox="0 0 625 535"/);
    assert.match(model,/data-map-wait/);
    assert.match(model,/data-commute-a/);
    assert.match(model,/data-commute-b/);
    assert.match(model,/data-racer="a"[\s\S]*data-racer="b"/);
    assert.match(model,/09:58[\s\S]*10:01/);
  }
  assert.deepEqual(tokyoFrame(0).a,tokyoFrame(0).b);
  assert.equal(tokyoFrame(tokyoTimes.nishi+3).b.phase,'transfer');
  assert.equal(tokyoFrame(tokyoTimes.nishi+3).a.phase,'stay');
  assert.equal(tokyoFrame(tokyoTimes.ote+1).a.phase,'street');
  assert.equal(tokyoFrame(tokyoTimes.tokyoPlatform+1).b.phase,'exit');
  assert.deepEqual(tokyoRace(),{a:55,b:58,duration:58,winner:'a',margin:3});
  assert.equal(tokyoRace(11).winner,'tie');
  assert.equal(tokyoRace(12).winner,'b');
  assert.ok(fs.statSync(tokyoBasemap).size>10000);
  assert.equal(geographicStops.length,4);
  assert.match(geographicPaths.shared,/^M515\.53 48\.61L.*L126\.41 336\.27$/);
  assert.ok(geographicPaths.yamanote.split('L').length>10);
});

test('the FIFA draft inspection shows the entire original chart and still highlights 3 million',()=>{
  const full=deck.slides.find(s=>s.id==='fifa-drafts').images[1].src;
  const slide=deck.slides.find(s=>s.id==='fifa-missing');
  assert.equal(slide.image,full);
  for(const ja of [true,false]){
    const html=renderWeek9(slide,{ja});
    assert.match(html,/week09-fifa-scatter\.webp/);
    assert.match(html,/viewBox="0 0 1879 1120"/);
    assert.match(html,/cx="112" cy="921"/);
  }
});

test('Tokyo map closes in at the transfer and holds both downtown routes through the finish',()=>{
  const {nishi,board}=tokyoTimes,full=tokyoMapFrame(0),close=tokyoMapFrame(board);
  assert.deepEqual(tokyoMapFrame(nishi-1),full);
  assert.deepEqual(tokyoMapFrame(nishi),full);
  assert.ok(tokyoMapFrame(nishi+1)[2]<full[2]);
  assert.ok(tokyoMapFrame(nishi+1)[2]>close[2]);
  assert.ok(close[2]<full[2]/2);
  assert.deepEqual(tokyoMapFrame(tokyoRace().duration),close);
  assert.deepEqual(tokyoMapFrame(nishi,{reducedMotion:true}),close);
  const [left,top,width,height]=close;
  const inside=(x,y)=>x>=left&&x<=left+width&&y>=top&&y<=top+height;
  assert.equal(inside(...geographicStops[0]),false);
  for(const path of ['stay','street','yamanote','exit']){
    for(const match of geographicPaths[path].matchAll(/[ML]([\d.]+) ([\d.]+)/g)){
      assert.ok(inside(+match[1],+match[2]),`${path} is visible in the close-up`);
    }
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
  const chart=renderWeek9(deck.slides.find(s=>s.id==='fifa-evidence'),{ja:false});
  assert.match(chart,/w9-fifa-plot[\s\S]+8 of 101 teams[\s\S]+39 of 102 teams[\s\S]+<\/svg>/);
  assert.equal([...chart.matchAll(/<circle class="w9-fifa-top w9-fifa-less"/g)].length,8);
  assert.equal([...chart.matchAll(/<circle class="w9-fifa-top w9-fifa-more"/g)].length,39);
  assert.equal([...chart.matchAll(/<circle class="w9-fifa-dot"/g)].length,203);
  assert.match(chart,/data-fifa-layer="1" aria-hidden="true"><circle class="w9-fifa-top w9-fifa-less"/);
  assert.match(chart,/data-fifa-layer="2" aria-hidden="true"><circle class="w9-fifa-top w9-fifa-more"/);
  assert.match(chart,/data-fifa-layer="3" aria-hidden="true">[\s\S]*8%[\s\S]*38%/);
  assert.match(chart,/data-fifa-layer="4" aria-hidden="true">[\s\S]*Cabo Verde[\s\S]*Iceland/);
  for(const s of deck.slides){
    for(const path of [s.image,...(s.images||[]).map(i=>i.src)].filter(path=>path?.startsWith('assets/'))){
      assert.ok(fs.statSync(path).size>1000,path);
    }
  }
});

test('Week 9 has a studio opener and ends on midterm preparation with no project showcase navigation',()=>{
  assert.equal(deck.slides.length,21);
  assert.equal(deck.slides.at(-1).id,'homework');
  assert.equal(deck.chapters.at(-1).id,'homework');
  assert.ok(!deck.slides.some(slide=>/^team-.*-2025$/.test(slide.id)));
});

test('the final slide and Week 10 guidelines tell the same design journey and link the separate forms',()=>{
  const final=deck.slides.at(-1);
  const midterm=fs.readFileSync('content/weeks/10-midterm-presentations.md','utf8');
  for(const ja of [true,false]){
    const html=renderWeek9(final,{ja});
    assert.match(html,/homework-submit\.html\?week=10/);
    assert.match(html,/homework-submit\.html\?week=9/);
    assert.match(html,ja?/各メンバーの初期案[\s\S]*班の最終版[\s\S]*根拠/:/initial design from each member[\s\S]*reveal one final group graphic[\s\S]*the evidence/);
  }
  assert.match(midterm,/10:50–11:22[^\n]*2-minute[^\n]*11:22–11:32\|Intermission/);
  assert.match(midterm,/one initial design from each member[\s\S]*reveal the single final graphic[\s\S]*explain the answer/);
  assert.match(midterm,/link: homework-submit\.html\?week=10/);
});

test('the classroom chart has sixteen themed groups and never embeds names in its public source',()=>{
  const slide=deck.slides.find(s=>s.id==='studio-seating');
  const numbers=[1,2,3,4,5,6,7,8,9,10,11,12,13,15,16,17];
  assert.deepEqual(slide.groups.map(([n])=>n),numbers);
  assert.ok(slide.groups.every(([,en,ja])=>en.split(' ').length<=2&&ja.length>1));
  const pub=renderWeek9(slide,{ja:false});
  const classroom=renderWeek9(slide,{ja:false,seating:{1:['Example <Private>']}});
  assert.equal((pub.match(/data-group=/g)||[]).length,16);
  assert.doesNotMatch(pub,/<ul>|Example/);
  assert.match(classroom,/Example &lt;Private&gt;/);
  assert.match(fs.readFileSync('.gitignore','utf8'),/week09-seating\.local\.json/);
});

test('the taller FIFA plot links both names to their existing data points',()=>{
  const slide=deck.slides.find(s=>s.id==='fifa-evidence');
  assert.equal(slide.canvasHeight,1160);
  for(const ja of [true,false]){
    const html=renderWeek9(slide,{ja});
    assert.match(html,/viewBox="0 0 1600 1160"/);
    for(const [code,en,jp] of [['CPV','Cabo Verde','カーボベルデ'],['ISL','Iceland','アイスランド']]){
      const group=html.split(`data-team="${code}">`)[1].split('</g>')[0];
      assert.ok(group.includes(ja?jp:en));
      const [,x,y]=group.match(/class="w9-fifa-callout-point" cx="([^"]+)" cy="([^"]+)"/);
      assert.ok(group.includes(`L${x} ${y}"`));
      assert.ok(html.includes(`class="w9-fifa-dot" cx="${x}" cy="${y}"`));
    }
  }
});

test('Week 9 activities have the same continuous schedule in the agenda and slides',()=>{
  const context=vm.createContext({document:{addEventListener(){}},window:{},URL,URLSearchParams});
  vm.runInContext(fs.readFileSync('assets/site.js','utf8'),context);
  const activities=vm.runInContext('parseInClassActivities',context)(source);
  const slides=deck.slides.filter(slide=>slide.kind==='activity');
  const intervals=['11:00–11:15','11:15–11:25','11:25–11:45','11:45–12:10','12:10–12:20'];
  assert.equal(activities.length,3);
  for(const [field,lang] of [['steps','en'],['steps_ja','ja']]){
    const copy=activities.map(a=>[a[lang==='ja'?'text_ja':'text'],...a[field]].join(' ')).join(' ');
    const deckCopy=slides.map(s=>[...s.steps[lang],s.notes[lang]].join(' ')).join(' ');
    for(const range of intervals.map(span=>lang==='ja'?span.replace('–','〜'):span)){
      assert.ok(copy.includes(range),range);
      assert.ok(deckCopy.includes(range),range);
    }
  }
});
