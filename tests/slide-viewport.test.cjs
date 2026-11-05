const test=require('node:test');
const assert=require('node:assert/strict');
const {zoomAt,constrain,wheelFactor}=require('../assets/slide-viewport.js');
test('zoom preserves the point under the cursor, and reverses without drifting',()=>{
 const start={x:-80,y:-25,scale:1.2},anchor={x:330,y:180};
 const next=zoomAt(start,2,anchor);
 for(const key of ['x','y'])assert.ok(Math.abs((anchor[key]-start[key])/start.scale-(anchor[key]-next[key])/next.scale)<1e-9);
 const back=zoomAt(next,1.2,anchor);assert.ok(Math.abs(back.x-start.x)<1e-9);assert.ok(Math.abs(back.y-start.y)<1e-9);
});
test('small wheel input stays gentle, normalizes units and caps extreme deltas',()=>{
 assert.ok(Math.abs(wheelFactor(1)-1)<.003);
 assert.equal(wheelFactor(1,1),wheelFactor(16));
 assert.ok(wheelFactor(-10000)<1.13);assert.ok(wheelFactor(10000)>.88);
 assert.ok(zoomAt({x:0,y:0,scale:1},.1,{x:0,y:0}).scale===1);
});
test('panning cannot lose the slide, and a fitted slide stays centered',()=>{
 assert.deepEqual(constrain({x:10000,y:-10000,scale:2},800,450,1000,600),{x:8,y:-308,scale:2});
 assert.deepEqual(constrain({x:100,y:-200,scale:1},800,450,1000,600),{x:100,y:75,scale:1});
});
