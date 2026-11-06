import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLD,hash,themeCenters,voiceTarget,sharedThreads } from '../voices/atlas-model.mjs';

test('the atlas gives real voices deterministic, finite positions for small and classroom-sized groups',()=>{
  const keys=['education','money','work','care','access','voice','identity','environment','other'];
  for(const count of [0,1,3,15,80]){
    const centers=themeCenters(keys,count);
    for(let i=0;i<count;i++){
      const voice={id:`voice-${i}`,categories:[keys[i%9],keys[(i+2)%9]]};
      const target=voiceTarget(voice,centers,count,i);
      assert.deepEqual(target,voiceTarget(voice,centers,count,i));
      assert.ok(target.x>0&&target.x<WORLD.width&&target.y>0&&target.y<WORLD.height);
    }
  }
  assert.equal(hash('same voice'),hash('same voice'));
});
test('paths connect only participant-chosen shared themes, without duplicates or self-links',()=>{
  const nodes=[
    {id:'a',categories:['education','money'],x:0,y:0},
    {id:'b',categories:['education'],x:10,y:10},
    {id:'c',categories:['care'],x:1,y:1},
    {id:'d',categories:['money'],x:15,y:20},
    {id:'e',categories:['education'],x:100,y:100}
  ];
  const links=sharedThreads(nodes);
  assert.equal(new Set(links.map(e=>e.key)).size,links.length);
  for(const {source,target} of links){assert.notEqual(source.id,target.id);assert.ok(source.categories.some(t=>target.categories.includes(t)));}
  assert.ok(!links.some(e=>e.source.id==='c'||e.target.id==='c'));
  assert.deepEqual(sharedThreads([]),[]);
});
test('unclassified open-text voices have finite positions and no invented relationships',()=>{
 const centers=themeCenters(['other','education'],80);
 const nodes=Array.from({length:80},(_,i)=>{const voice={id:`open-${i}`,categories:[]};return {...voice,...voiceTarget(voice,centers,80,i)};});
 for(const n of nodes){assert.ok(Number.isFinite(n.x)&&n.x>0&&n.x<WORLD.width);assert.ok(Number.isFinite(n.y)&&n.y>0&&n.y<WORLD.height);}
 assert.deepEqual(sharedThreads(nodes),[]);
});

const {detectTopics,packVoices}=await import('../voices/topic-model.mjs');
test('detected topics connect open text while preserving isolated voices and original categories',()=>{
 const entries=[{id:'a',headline:'学費が高い。バイトで払う',categories:[]},{id:'b',headline:'学費と奨学金で困っている',categories:[]},{id:'c',headline:'zyxw uncommon isolated',categories:[]}];
 const model=detectTopics(entries);assert.ok(model.membership.get('a').includes('theme:money'));assert.ok(model.membership.get('b').includes('theme:money'));assert.deepEqual(model.membership.get('c'),[]);assert.deepEqual(entries[0].categories,[]);
 for(const g of model.groups)assert.ok(g.members.length>=2);
});
test('adaptive layout keeps 120 variable-height voice rectangles separate at wide and narrow aspects',()=>{
 for(const aspect of [.7,1.8,2.4]){const nodes=Array.from({length:120},(_,i)=>({w:300+i%3*20,h:90+i%7*25}));const box=packVoices(nodes,aspect);
 for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j];assert.ok(Math.abs(a.x-b.x)>=(a.w+b.w)/2||Math.abs(a.y-b.y)>=(a.h+b.h)/2);}
 assert.ok(nodes.every(n=>n.x-n.w/2>=0&&n.x+n.w/2<=box.width&&n.y+n.h/2<=box.height));}
});
