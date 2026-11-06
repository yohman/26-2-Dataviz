const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const payload = JSON.parse(fs.readFileSync('lectures/w06_lores.notes.json','utf8'));
test('historical cases have aligned factual notes and direct complete-scan links', () => {
  assert.deepEqual(payload.slides.map(s=>s.page),[1,2,3,4,5,6,7,8,17]);
  for(const note of payload.slides){
    assert.ok(note.ja && note.en && note.sources.length>=1);
    note.sources.forEach(url=>assert.equal(new URL(url).protocol,'https:'));
    assert.doesNotMatch(note.en,/ask students|invite students/i);
  }
  assert.match(payload.slides.find(s=>s.page===3).en,/Dolben Act/);
  assert.match(payload.slides.find(s=>s.page===17).en,/exception for punishment for crime/);
});
test('original-deck notes appear on the new pages and stay hidden on unchanged pages', async () => {
  const nodes=new Map(['[data-notes-heading]','[data-notes-text]','[data-notes-sources]'].map(key=>[key,{textContent:'',replaceChildren(){},append(){}}]));
  let language='ja';
  const window={fetch:async()=>({ok:true,json:async()=>payload})};
  vm.runInNewContext(fs.readFileSync('assets/slide-notes.js','utf8'),{window,URL});
  const root={hidden:true,querySelector:key=>nodes.get(key),ownerDocument:{createElement:()=>({})}};
  const notes=window.createSlideNotes({root,file:payload.file,page:4,language:()=>language});
  await notes.ready;assert.equal(root.hidden,false);assert.match(nodes.get('[data-notes-text]').textContent,/Brookes/);
  notes.setPage(13);assert.equal(root.hidden,true);
  language='en';notes.setPage(17);assert.equal(root.hidden,false);assert.match(nodes.get('[data-notes-text]').textContent,/Thirteenth Amendment/);
});

test('Week 6 cuts use the original numbers and graphics precede each context slide',()=>{
 const plan=JSON.parse(fs.readFileSync('lectures/w06-order.json','utf8'));
 assert.deepEqual(plan.removed,[5,6,8,13,14,15]);
 assert.equal(plan.order.length,34);
 assert.deepEqual(plan.order.slice(0,8),['ifab-laws-cover','voices-japanese-demo','1788','brookes-exterior','brookes-plans','brookes-section','brookes-complete',23]);
 assert.deepEqual(plan.removed_current_pages,[7,8,9,10,11,12,13,14,15,16,22,23,24,25,26,27]);
 assert.equal(plan.order[16],'13th-amendment');
 for(const n of plan.removed_current_pages)assert.ok(!plan.order.includes(plan.previous_order[n-1]));
 for(const page of plan.removed)assert.ok(!plan.order.includes(page));
 assert.equal(new Set(plan.order).size,plan.order.length);
});
