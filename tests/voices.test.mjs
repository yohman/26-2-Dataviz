import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import worker from '../cloudflare/gallery-likes/worker.mjs';
const origin='http://127.0.0.1:8767',a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
function database(){const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync(new URL('../cloudflare/gallery-likes/voices-schema.sql',import.meta.url),'utf8'));const adapter={prepare(sql){let args=[];return {bind(...values){args=values;return this;},async first(){return db.prepare(sql).get(...args)||null;},async all(){return {results:db.prepare(sql).all(...args)};},async run(){return {meta:db.prepare(sql).run(...args)};}};},async batch(stmts){db.exec('BEGIN');try{const result=[];for(const s of stmts)result.push(await s.run());db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}}};return {db,adapter};}
function setup(){const {db,adapter}=database(),env={ALLOWED_ORIGINS:origin,COURSE_DB:adapter};const call=async(method,body,room='',browser=a,key='',query='')=>worker.fetch(new Request(`https://test/voices${room?`?room=${room}${query?'&'+query:''}`:''}`,{method,headers:{Origin:origin,'Content-Type':'application/json','X-Browser-ID':browser,...(key?{'X-Host-Key':key}:{})},...(body?{body:JSON.stringify(body)}:{})}),env);return {db,env,call};}
const entry=(id=crypto.randomUUID())=>({id,headline:'A fair chance to learn',detail:'Time to study.',change:'More flexibility.',categories:['education','work'],reach:2,urgency:4});
test('voice sessions preserve anonymous public views, host-only moderation and reopening',async()=>{
 const {call}=setup(),r=await call('POST',{action:'create',title:'Justice lab'});assert.equal(r.status,201);const host=await r.json();
 const e=entry();assert.equal((await call('POST',e,host.code)).status,201);
 let data=await (await call('GET',null,host.code,b)).json();assert.equal(data.items.length,1);assert.equal(data.items[0].headline,e.headline);assert.equal(data.items[0].browser,undefined);assert.equal(data.room.host_hash,undefined);assert.equal(data.host,false);
 assert.equal((await call('PATCH',{id:e.id,hidden:true},host.code,b)).status,403);
 await call('PATCH',{id:e.id,hidden:true},host.code,a,host.hostKey);
 data=await (await call('GET',null,host.code,b)).json();assert.equal(data.items.length,0);
 data=await (await call('GET',null,host.code,a,host.hostKey)).json();assert.equal(data.items[0].hidden,true);
 await call('PATCH',{id:e.id,hidden:false},host.code,a,host.hostKey);
 await call('PATCH',{open:false},host.code,a,host.hostKey);
 assert.equal((await call('POST',entry(),host.code)).status,409);
 await call('PATCH',{open:true},host.code,a,host.hostKey);
 assert.equal((await call('POST',entry(),host.code)).status,201);
});
test('echoes are idempotent, per browser and reversible; retries never duplicate voices',async()=>{
 const {call}=setup(),host=await (await call('POST',{action:'create',title:'Session'})).json(),e=entry();
 await call('POST',e,host.code);await call('POST',e,host.code);
 for(let i=0;i<2;i++)await call('PUT',{id:e.id,active:true},host.code,a);
 await call('PUT',{id:e.id,active:true},host.code,b);
 let data=await (await call('GET',null,host.code,a)).json();assert.equal(data.items.length,1);assert.equal(data.items[0].resonance,2);assert.equal(data.items[0].mine,true);
 await call('PUT',{id:e.id,active:false},host.code,a);
 data=await (await call('GET',null,host.code,a)).json();assert.equal(data.items[0].resonance,1);assert.equal(data.items[0].mine,false);
 assert.equal((await call('POST',e,host.code,b)).status,409);
});
test('feeds paginate beyond 1000 entries; revision requests do not publish invented totals',async()=>{
 const {call,db}=setup(),host=await (await call('POST',{action:'create',title:'Large session'})).json();
 const stmt=db.prepare('INSERT INTO voice_entries(id,room,browser,headline,categories,reach,urgency) VALUES(?,?,?,?,?,?,?)');for(let i=0;i<1103;i++)stmt.run(crypto.randomUUID(),host.code,a,`Voice ${i}`,'["education"]',1,3);
 let data=await (await call('GET',null,host.code)).json(),all=[...data.items];while(data.nextCursor){data=await (await call('GET',null,host.code,a,'',`cursor=${data.nextCursor}`)).json();all.push(...data.items);}assert.equal(all.length,1103);assert.equal(new Set(all.map(e=>e.id)).size,1103);
 data=await (await call('GET',null,host.code,a,'','revision=0')).json();assert.equal(data.unchanged,true);assert.equal(data.items,undefined);
});
test('validation, room isolation, rate limits and CORS protect the new endpoint',async()=>{
 const {call,env}=setup(),host=await (await call('POST',{action:'create',title:'Test'})).json();
 for(const item of [{...entry(),headline:''},{...entry(),headline:'x'.repeat(91)},{...entry(),categories:['education','education']},{...entry(),categories:['bad']},{...entry(),urgency:6},{...entry(),reach:0}])assert.equal((await call('POST',item,host.code)).status,400);
 const other=await (await call('POST',{action:'create',title:'Other'})).json(),e=entry();await call('POST',e,host.code);assert.equal((await call('PUT',{id:e.id,active:true},other.code)).status,404);
 env.COMMENT_LIMITER={limit:async()=>({success:false})};assert.equal((await call('POST',entry(),host.code)).status,429);
 const preflight=await worker.fetch(new Request('https://test/voices',{method:'OPTIONS',headers:{Origin:origin}}),env);assert.match(preflight.headers.get('Access-Control-Allow-Methods'),/PATCH/);assert.match(preflight.headers.get('Access-Control-Allow-Headers'),/X-Host-Key/);
});
