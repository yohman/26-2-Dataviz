const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const payload = JSON.parse(fs.readFileSync('lectures/w06_lores.notes.json','utf8'));
test('historical cases have aligned factual notes and direct complete-scan links', () => {
  assert.deepEqual(payload.slides.map(s=>s.page),[1,2,3,4,5,6,7,8,9]);
  for(const note of payload.slides){
    assert.ok(note.ja && note.en && note.sources.length>=2);
    note.sources.forEach(url=>assert.equal(new URL(url).protocol,'https:'));
    assert.doesNotMatch(note.en,/ask students|invite students/i);
  }
  assert.match(payload.slides.find(s=>s.page===6).en,/weekly family earnings, not individual hourly pay/);
  assert.match(payload.slides.find(s=>s.page===9).en,/not a map that advanced justice/);
});
test('original-deck notes appear on the new pages and stay hidden on unchanged pages', async () => {
  const nodes=new Map(['[data-notes-heading]','[data-notes-text]','[data-notes-sources]'].map(key=>[key,{textContent:'',replaceChildren(){},append(){}}]));
  let language='ja';
  const window={fetch:async()=>({ok:true,json:async()=>payload})};
  vm.runInNewContext(fs.readFileSync('assets/slide-notes.js','utf8'),{window,URL});
  const root={hidden:true,querySelector:key=>nodes.get(key),ownerDocument:{createElement:()=>({})}};
  const notes=window.createSlideNotes({root,file:payload.file,page:1,language:()=>language});
  await notes.ready;assert.equal(root.hidden,false);assert.match(nodes.get('[data-notes-text]').textContent,/Brookes/);
  notes.setPage(10);assert.equal(root.hidden,true);
  language='en';notes.setPage(8);assert.equal(root.hidden,false);assert.match(nodes.get('[data-notes-text]').textContent,/grades A-D/);
});

test('Week 6 cuts use the original numbers and graphics precede each context slide',()=>{
 const plan=JSON.parse(fs.readFileSync('lectures/w06-order.json','utf8'));
 assert.deepEqual(plan.removed,[5,6,8,13,14,15]);
 assert.equal(plan.order.length,44);
 assert.deepEqual(plan.order.slice(0,9),['brookes-plan','brookes-section',23,26,25,28,27,30,29]);
 assert.equal(plan.order.indexOf(12)+1,plan.order.indexOf(9));
 for(const page of plan.removed)assert.ok(!plan.order.includes(page));
 assert.equal(new Set(plan.order).size,plan.order.length);
});
