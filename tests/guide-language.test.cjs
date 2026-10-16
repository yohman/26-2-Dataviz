const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
test('dashboard guide uses the shared language toggle for both three-step versions',()=>{
 const nodes=['ja','en'].map(courseLang=>({dataset:{courseLang},hidden:false}));
 const context={document:{addEventListener(){},querySelectorAll:()=>nodes},window:{}};
 vm.createContext(context);vm.runInContext(fs.readFileSync('assets/site.js','utf8'),context);
 vm.runInContext("applyCourseLanguageSections('ja')",context);
 assert.deepEqual(nodes.map(n=>n.hidden),[false,true]);
 vm.runInContext("applyCourseLanguageSections('en')",context);
 assert.deepEqual(nodes.map(n=>n.hidden),[true,false]);
 const html=fs.readFileSync('tableau-dashboard-guide.html','utf8');
 assert(!html.includes('English instructions'));
 assert.match(html,/assets\/site\.js/);
 const lists=[...html.matchAll(/<ol class="guide-steps">([\s\S]*?)<\/ol>/g)];
 assert.equal(lists.length,2);
 lists.forEach(list=>assert.equal((list[1].match(/<li>/g)||[]).length,3));
});
