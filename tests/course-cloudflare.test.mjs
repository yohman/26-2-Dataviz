import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import worker from '../cloudflare/gallery-likes/worker.mjs';
import {validateHomework} from '../cloudflare/gallery-likes/course.mjs';
const origin='http://127.0.0.1:8767',browser='00000000-0000-4000-8000-000000000001',other='00000000-0000-4000-8000-000000000002';
const body={week:5,studentId:'12345678',studentName:'Student',title:'Finding',tools:'Python',description:'A surprising pattern',projectUrl:'https://example.org/data',notebookUrl:'https://example.org/notebook',images:['data:image/jpeg;base64,/9j/AAAA'],requestId:crypto.randomUUID(),revisionToken:crypto.randomUUID()};
function fixture() {
  const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync('cloudflare/gallery-likes/course-schema.sql','utf8'));
  db.prepare('INSERT INTO week_schedule VALUES(?,?,?,?)').run(5,'Week 5',0,Date.now()+3600000);
  const COURSE_DB={prepare(sql){let args=[];const result={bind(...values){args=values;return result;},all:async()=>({results:db.prepare(sql).all(...args)}),first:async()=>db.prepare(sql).get(...args),run:async()=>({meta:db.prepare(sql).run(...args)})};return result;},async batch(statements){db.exec('BEGIN');try {const results=[];for(const s of statements)results.push(await s.run());db.exec('COMMIT');return results;}catch(error){db.exec('ROLLBACK');throw error;}}};
  return {db,env:{COURSE_DB,ALLOWED_ORIGINS:origin}};
}
const request=(path,method='GET',data,identity=browser)=>new Request('https://test'+path,{method,headers:{Origin:origin,'X-Browser-ID':identity},...(data?{body:JSON.stringify(data)}:{})});
test('homework validates required images, fields, URLs and private identity',()=>{
  assert(validateHomework(body));
  for(const patch of [{images:[]},{images:['data:text/html;base64,AAAA']},{images:Array(3).fill(body.images[0])},{studentId:''},{week:0},{title:' '},{notebookUrl:'javascript:alert(1)'},{revisionToken:'guess'}])assert(!validateHomework({...body,...patch}));
});
test('D1 homework is idempotent, revision-safe, private and serves both images without Google',async()=>{
  const {db,env}=fixture();try {
    const submitted={...body,images:[...body.images,...body.images]};
    const first=await worker.fetch(request('/homework?week=5','POST',submitted),env);assert.equal(first.status,201);
    const id=(await first.json()).id;
    assert.equal((await worker.fetch(request('/homework?week=5','POST',submitted),env)).status,200);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM submission_revisions').get().n,1);
    const revised={...submitted,title:'Updated',requestId:crypto.randomUUID()};
    assert.equal((await worker.fetch(request('/homework?week=5','POST',revised),env)).status,201);
    const feed=await worker.fetch(new Request('https://test/gallery'),env).then(r=>r.json());
    assert.equal(feed.items.length,1);assert.equal(feed.items[0].title,'Updated');assert.equal(`5-${feed.items[0].imageIndex}`,id);
    assert.equal(feed.items[0].imageUrls.length,2);
    assert(!JSON.stringify(feed).includes(body.studentId));assert(!JSON.stringify(feed).includes(body.revisionToken));assert(!JSON.stringify(feed).includes(browser));
    const image=await worker.fetch(new Request(feed.items[0].imageUrl),env);assert.equal(image.status,200);assert.equal(image.headers.get('Content-Type'),'image/jpeg');assert.deepEqual([...new Uint8Array(await image.arrayBuffer())],[255,216,255,0,0,0]);
    assert.equal((await worker.fetch(request('/homework?week=5','POST',{...revised,requestId:crypto.randomUUID(),revisionToken:crypto.randomUUID()},other),env)).status,409);
    assert.equal((await worker.fetch(request('/homework?week=5','POST',{...revised,requestId:crypto.randomUUID()},other),env)).status,201);
    db.prepare('UPDATE week_schedule SET deadline_ms=0').run();
    assert.equal((await worker.fetch(request('/homework?week=5','POST',{...revised,requestId:crypto.randomUUID()},other),env)).status,403);
    assert.equal((await worker.fetch(request('/source_archive'),env)).status,404);
  }finally{db.close();}
});
test('gallery pagination retrieves more than 1000 works without truncation',async()=>{
  const {db,env}=fixture();try {
    const insert=db.prepare('INSERT INTO submissions(image_index,week,student_key,public_json) VALUES(?,1,?,?)');
    for(let i=0;i<1005;i++)insert.run(i,'student-'+i,JSON.stringify({title:'Work '+i}));
    const items=[];let cursor='';do {const response=await worker.fetch(new Request('https://test/gallery'+(cursor?'?cursor='+cursor:'')),env);const page=await response.json();assert(page.items.length<=250);items.push(...page.items);cursor=page.nextCursor;}while(cursor);
    assert.equal(items.length,1005);assert.equal(new Set(items.map(i=>i.imageIndex)).size,1005);
  }finally{db.close();}
});
test('the midterm saves up to three optional teammates privately and accepts a blank Slides link',async()=>{
  const {db,env}=fixture();
  try {
    db.prepare('INSERT INTO week_schedule VALUES(?,?,?,?)').run(10,'Midterm',0,Date.now()+3600000);
    const slides='https://docs.google.com/presentation/d/example-deck/edit';
    const teammates=[
      {studentId:'24680000',studentName:'Teammate Two'},
      {studentId:'24680001',studentName:'Teammate Three'},
      {studentId:'',studentName:'Teammate Four'},
    ];
    const entry={...body,week:10,notebookUrl:slides,teammates,requestId:crypto.randomUUID()};
    assert.equal((await worker.fetch(request('/homework?week=10','POST',entry),env)).status,201);
    const gallery=()=>worker.fetch(new Request('https://test/gallery'),env).then(r=>r.json());
    const [published]=(await gallery()).items;
    assert.equal(published.imageCount,1);assert.equal(published.notebookUrl,slides);
    assert.equal(published.studentName,body.studentName);
    assert.doesNotMatch(JSON.stringify(published),/teammates|Teammate|2468000/);
    const privateRecord=({requestId})=>JSON.parse(db.prepare('SELECT private_json FROM submission_revisions WHERE request_id=?').get(requestId).private_json);
    assert.deepEqual(privateRecord(entry).teammates,teammates);
    const single={...entry,teammates:[],notebookUrl:'',requestId:crypto.randomUUID()};
    assert.equal((await worker.fetch(request('/homework?week=10','POST',single),env)).status,201);
    assert.deepEqual(privateRecord(single).teammates,[]);
    assert.equal((await gallery()).items[0].notebookUrl,'');
  } finally {db.close();}
});
test('midterm has four student slots and keeps the Slides field optional',()=>{
  const html=fs.readFileSync('homework-submit.html','utf8');
  const input=key=>html.match(new RegExp(`<input name="${key}"[^>]*>`))?.[0]||'';
  for(const key of ['studentId','studentName']){
    assert.match(input(key),/\brequired\b/);
    for(const slot of [2,3,4]){
      assert.match(input(key+slot),/\bdisabled\b/);
      assert.doesNotMatch(input(key+slot),/\brequired\b/);
    }
  }
  assert.match(input('notebookUrl'),/type="url"/);
  assert.doesNotMatch(input('notebookUrl'),/\brequired\b/);
  assert.match(fs.readFileSync('assets/homework-submissions.js','utf8'),/if\(isMidterm\)body\.teammates=teammateSlots/);
});
test('active client, homework links and snapshot job have no Apps Script dependency',()=>{
  for(const path of ['assets/site.js','assets/homework-submissions.js','scripts/sync-gallery.mjs'])assert.doesNotMatch(fs.readFileSync(path,'utf8'),/script\.google\.com|docs\.google\.com\/forms|JSONP|courseGalleryReceive/);
  assert.match(fs.readFileSync('assets/site.js','utf8'),/HOMEWORK_URL: 'homework-submit.html'/);
});
