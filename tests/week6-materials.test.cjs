const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = {document:{addEventListener(){}}, window:{}, URL, URLSearchParams};
vm.createContext(context);
vm.runInContext(fs.readFileSync('assets/site.js','utf8'),context);
context.source = fs.readFileSync('content/weeks/06-dubois-public-argument.md','utf8');
const week = vm.runInContext("parseWeek(source,'06-dubois-public-argument.md')",context);

test('Week 6 has a 100-minute agenda, 20-minute lecture and concise bilingual activities',()=>{
  assert.equal(week.course_date,'2026-11-06');
  assert.equal(week.lecture_gallery_week,'5');
  assert.equal(week.materials[0].href,'lectures/w06-dubois-public-argument.pdf');
  assert.match(week.schedule,/10:50–11:10/);
  assert.match(week.schedule,/11:10–11:40/);
  assert.match(week.schedule,/12:15–12:20/);
  assert.equal(week.activities.length,2);
  for(const activity of week.activities){
    assert.equal(activity.steps.length,3);
    assert.equal(activity.steps_ja.length,3);
  }
  assert.match(week.activities[1].text,/Groups of four/);
  assert.match(week.activities[1].text,/No separate group submission/);
  assert.equal(week.requirements.split(';').length,3);
  assert.equal(week.requirements_ja.split(';').length,3);
  assert.match(week.requirements,/one screenshot or photo.*second is optional/);
});

test('inline source guide retains original values, scope, uncertainty and both languages',()=>{
  vm.runInContext(fs.readFileSync('assets/dubois-guide.js','utf8'),context);
  const d=context.window.DUBOIS_DATA;
  assert.deepEqual(Array.from(d.city,row=>row[1]),[78139,8025,37699,734952]);
  assert.equal(d.city.reduce((sum,row)=>sum+row[1],0),858815);
  assert.deepEqual(Array.from(d.literacy,row=>row[1]),[99,92,81.8,67.27,50]);
  assert.equal(d.literacy[4][2],'estimate');
  for(const ja of [true,false]){
    const html=context.window.renderDuBoisGuide(ja);
    assert.match(html,/734,952/);
    assert.match(html,/67.27/);
    assert.match(html,ja?/推定/:/Estimate/);
    assert.match(html,/2013650430/);
    assert.match(html,/2013650433/);
    assert.match(html,/target="_blank" rel="noopener"/);
  }
  assert.match(fs.readFileSync('agenda.html','utf8'),/dubois-guide\.js/);
});

test('Week 6 PDF and factual notes align, pacing sums to 20, originals are preserved',()=>{
  const payload=JSON.parse(fs.readFileSync('lectures/w06-dubois-public-argument.notes.json','utf8'));
  assert.equal(payload.slides.length,17);
  assert.equal(payload.lectureSlides,14);
  assert.equal(payload.slides.reduce((sum,s)=>sum+s.minutes,0),20);
  payload.slides.forEach((s,i)=>{
    assert.equal(s.page,i+1);
    assert.ok(s.ja && s.en);
    assert.doesNotMatch(s.en,/ask students|invite students|for the instructor/i);
  });
  assert.match(payload.slides[9].en,/question marks/);
  assert.match(payload.slides[10].en,/dashed|estimate/);
  for(const file of [payload.file,'lectures/w06_lores.pdf','assets/images/week06/city-rural.jpg','assets/images/week06/illiteracy.jpg'])assert.ok(fs.existsSync(file));
});

test('Week 6 viewer loads its own aligned notes instead of Week 5 notes',async()=>{
  const nodes=new Map(['[data-notes-heading]','[data-notes-text]','[data-notes-sources]'].map(key=>[key,{textContent:'',replaceChildren(){},append(){}}]));
  const payload=JSON.parse(fs.readFileSync('lectures/w06-dubois-public-argument.notes.json','utf8'));
  let requested;
  const window={fetch:async url=>{requested=url;return {ok:true,json:async()=>payload};}};
  const sandbox={window,URL};vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync('assets/slide-notes.js','utf8'),sandbox);
  const root={hidden:true,querySelector:key=>nodes.get(key),ownerDocument:{createElement:()=>({})}};
  const notes=window.createSlideNotes({root,file:payload.file,language:()=> 'ja',page:10});
  await notes.ready;
  assert.match(requested,/w06-dubois-public-argument.notes.json/);
  assert.equal(nodes.get('[data-notes-text]').textContent,payload.slides[9].ja);
  notes.setPage(17);
  assert.equal(nodes.get('[data-notes-text]').textContent,payload.slides[16].ja);
});
