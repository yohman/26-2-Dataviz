const test=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
const window={};vm.runInNewContext(fs.readFileSync('assets/gallery-explore.js','utf8'),{window,Intl});
const model=window.galleryExploreModel;
test('language trails count distinct works, omit filler, and preserve student wording',()=>{
 const groups=model.wordGroups([{title:'Earthquakes earthquakes earthquakes',description:'the data visualization'},{title:'Earthquakes in Japan',description:'earthquakes'}]);
 assert.equal(groups.find(g=>g.id==='earthquakes').items.length,2);assert(!groups.some(g=>['the','data','visualization','japan'].includes(g.id)));
});
test('tool edges measure co-use within a submission, never unrelated popularity',()=>{
 const items=[{tools:'Excel,Python'},{tools:'Python'},{tools:'Excel,Python'},{tools:'Tableau'}];
 const modelGraph=model.toolGraph(items,raw=>raw.split(',').map(name=>({name})));
 assert.equal(modelGraph.edges.get('Excel|Python'),2);assert.equal(modelGraph.edges.get('Python|Tableau'),undefined);assert.equal(modelGraph.groups.find(g=>g.id==='Python').items.length,3);
});
test('subject threads recognise both languages and allow overlap',()=>{
 const item={title:'野球選手の収入',description:'baseball salary'};const groups=model.subjectGroups([item]);assert(groups.some(g=>g.id==='sport'));assert(groups.some(g=>g.id==='money'));
});
