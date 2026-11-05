const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const payload = JSON.parse(fs.readFileSync('lectures/w06_lores.notes.json','utf8'));
test('historical cases have aligned factual notes and direct complete-scan links', () => {
  assert.deepEqual(payload.slides.map(s=>s.page),[23,24,25,26,27,28,29,30,50]);
  for(const note of payload.slides){
    assert.ok(note.ja && note.en && note.sources.length>=2);
    note.sources.forEach(url=>assert.equal(new URL(url).protocol,'https:'));
    assert.doesNotMatch(note.en,/ask students|invite students/i);
  }
  assert.match(payload.slides.find(s=>s.page===28).en,/weekly family earnings, not individual hourly pay/);
  assert.match(payload.slides.find(s=>s.page===29).en,/not a map that advanced justice/);
});
test('original-deck notes appear on the new pages and stay hidden on unchanged pages', async () => {
  const nodes=new Map(['[data-notes-heading]','[data-notes-text]','[data-notes-sources]'].map(key=>[key,{textContent:'',replaceChildren(){},append(){}}]));
  let language='ja';
  const window={fetch:async()=>({ok:true,json:async()=>payload})};
  vm.runInNewContext(fs.readFileSync('assets/slide-notes.js','utf8'),{window,URL});
  const root={hidden:true,querySelector:key=>nodes.get(key),ownerDocument:{createElement:()=>({})}};
  const notes=window.createSlideNotes({root,file:payload.file,page:23,language:()=>language});
  await notes.ready;assert.equal(root.hidden,false);assert.match(nodes.get('[data-notes-text]').textContent,/Brookes/);
  notes.setPage(22);assert.equal(root.hidden,true);
  language='en';notes.setPage(30);assert.equal(root.hidden,false);assert.match(nodes.get('[data-notes-text]').textContent,/grades A-D/);
});
