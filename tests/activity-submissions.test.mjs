import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare/gallery-likes/worker.mjs';
import { validActivity } from '../cloudflare/gallery-likes/activities.mjs';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
const origin='http://127.0.0.1:8767';
const browser='00000000-0000-4000-8000-000000000001';
const body={week:4,groupNumber:1,members:'A, B, C, D',title:'Test',description:'Finding',images:['data:image/jpeg;base64,/9j/AAAA']};
const request=(method,data)=>new Request('https://test/activities?week=4',{method,headers:{Origin:origin,'X-Browser-ID':browser},...(data?{body:JSON.stringify(data)}:{})});
test('in-class submissions validate required fields, group bounds, and image format/size',()=>{
  assert(validActivity(body));
  for(const patch of [{week:5},{groupNumber:0},{groupNumber:31},{members:' '},{title:'x'.repeat(121)},{images:[]},{images:['data:text/html;base64,aaaa']},{images:['data:image/jpeg;base64,/9j/'+'A'.repeat(520000)]}]) assert(!validActivity({...body,...patch}));
});
test('the in-class feed returns metadata without image bodies or browser identity',async()=>{
  let sql;
  const DB={prepare(q){sql=q;return{bind(){return{all:async()=>({results:[{groupNumber:1,title:'Test',mine:1}]})}}}}};
  const response=await worker.fetch(request('GET'),{DB,ALLOWED_ORIGINS:origin});
  assert.equal(response.status,200);
  assert(!sql.includes('image_one'));
  assert.match(sql,/browser_id = \? AS mine/);
  assert.equal((await response.json()).items[0].mine,true);
});
test('another browser cannot overwrite an in-class group submission',async()=>{
  let sql,values;
  const DB={prepare(q){sql=q;return{bind(...args){values=args;return{run:async()=>({meta:{changes:0}})}}}}};
  const response=await worker.fetch(request('POST',body),{DB,ALLOWED_ORIGINS:origin});
  assert.equal(response.status,409);
  assert.match(sql,/WHERE activity_submissions.browser_id=excluded.browser_id/);
  assert.equal(values[2],browser);
});
test('same-browser resubmission uses a single upsert and supports two images',async()=>{
  let values;
  const DB={prepare(q){assert.match(q,/ON CONFLICT\(week,group_number\) DO UPDATE/);return{bind(...args){values=args;return{run:async()=>({meta:{changes:1}})}}}}};
  const response=await worker.fetch(request('POST',{...body,images:[...body.images,...body.images]}),{DB,ALLOWED_ORIGINS:origin});
  assert.equal(response.status,201);
  assert.equal(values[7],body.images[0]);
});

test('SQLite integration: two images, idempotent revision, public images, and browser isolation',async()=>{
  const db=new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(new URL('../cloudflare/gallery-likes/migrations/0003_activity_submissions.sql',import.meta.url),'utf8'));
  const DB={prepare(sql){return{bind(...values){const statement=db.prepare(sql);return{
    run:async()=>({meta:statement.run(...values)}),
    all:async()=>({results:statement.all(...values)}),
    first:async()=>statement.get(...values)
  }}}}};
  const env={DB,ALLOWED_ORIGINS:origin};
  try {
    const submitted={...body,images:[...body.images,...body.images]};
    assert.equal((await worker.fetch(request('POST',submitted),env)).status,201);
    assert.equal((await worker.fetch(request('POST',{...submitted,title:'Revised'}),env)).status,201);
    const feed=await worker.fetch(request('GET'),env).then(r=>r.json());
    assert.equal(feed.items.length,1);
    assert.equal(feed.items[0].title,'Revised');
    assert.equal(feed.items[0].mine,true);
    assert.equal(feed.items[0].hasSecondImage,1);
    assert(!('browser_id' in feed.items[0]));
    for(const slot of [1,2]) {
      const response=await worker.fetch(new Request(`https://test/activity-image?week=4&group=1&slot=${slot}`),env);
      assert.equal(response.status,200);
      assert.equal(response.headers.get('Content-Type'),'image/jpeg');
      assert.deepEqual([...new Uint8Array(await response.arrayBuffer())],[255,216,255,0,0,0]);
    }
    const other=new Request('https://test/activities',{method:'POST',headers:{Origin:origin,'X-Browser-ID':'00000000-0000-4000-8000-000000000002'},body:JSON.stringify(submitted)});
    assert.equal((await worker.fetch(other,env)).status,409);
    assert.equal(db.prepare('SELECT title FROM activity_submissions').get().title,'Revised');
  } finally {db.close();}
});
