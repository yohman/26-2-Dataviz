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
