// Read-only verification against the pre-cutover public snapshot.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const base='https://dataviz-gallery-likes.ykawano.workers.dev';
// Pin the last verified Google-backed snapshot, not a subsequently refreshed file.
const old=JSON.parse(execFileSync('git',['show','531d152:data/gallery-public.json'],{encoding:'utf8'}));
const live=[];let cursor='';
do {const response=await fetch(base+'/gallery'+(cursor?'?cursor='+cursor:''));assert.equal(response.status,200);const page=await response.json();live.push(...page.items);cursor=page.nextCursor;}while(cursor);
const key=i=>`${i.week}-${i.imageIndex}`;
const source=new Map(old.items.map(i=>[key(i),i]));
assert.equal(live.length,old.items.length);
for(const item of live){const previous=source.get(key(item));assert(previous);for(const field of ['week','imageIndex','title','studentName','tools','projectUrl','description','imageCount'])assert.equal(item[field],field==='studentName'?previous[field].replace(/\b\d{10}\b/g,'').trim():previous[field]);}
const samples=[...new Set([1,2,3,4].map(week=>live.find(i=>i.week===week)).concat(live.find(i=>i.imageCount===2)))];
let checked=0;
for(const item of samples)for(let slot=0;slot<item.imageCount;slot++){
  const previous=source.get(key(item));const path=previous.imageUrls[slot];
  const response=await fetch(item.imageUrls[slot]);assert.equal(response.status,200);
  const bytes=Buffer.from(await response.arrayBuffer());
  const original=await readFile(path);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),createHash('sha256').update(original).digest('hex'));checked++;
}
const headers={Origin:'https://yohman.github.io','X-Browser-ID':crypto.randomUUID()};
const likes=await fetch(base+'/likes',{headers}).then(r=>r.json());
const comments=await fetch(base+'/comments',{headers}).then(r=>r.json());
assert(Array.isArray(likes.items));assert(Array.isArray(comments.items));
assert.equal((await fetch(base+'/source_archive',{headers})).status,404);
const closed=await fetch(base+'/homework?week=4',{headers}).then(r=>r.json());assert.equal(closed.open,false);
assert.equal((await fetch(base+'/homework?week=4',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:'{}'})).status,403);
console.log(JSON.stringify({worksCompared:live.length,imageBytesVerified:checked,hearts:likes.items.reduce((a,i)=>a+i.count,0),comments:comments.items.reduce((a,i)=>a+i.count,0),privateArchiveInaccessible:true,closedWeekRejected:true}));
