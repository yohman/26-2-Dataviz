// One-time, local migration. Private inputs and generated SQL MUST stay outside the repo.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
const root=resolve(process.argv[2] || '.');
const output=process.argv[3];
if (!output?.startsWith('/tmp/')) throw new Error('Provide a private /tmp/ SQL output path');
const rows=JSON.parse(await readFile('/tmp/dataviz-responses-archive.json','utf8'));
const legacy=JSON.parse(await readFile('/tmp/dataviz-legacyLikes-archive.json','utf8'));
const snapshot=JSON.parse(await readFile(join(root,'data/gallery-public.json'),'utf8'));
const base='https://dataviz-gallery-likes.ykawano.workers.dev';
const hash=value=>createHash('sha256').update(value).digest('hex');
const sql=value=>value===null?'NULL':"'"+String(value).replaceAll("'","''")+"'";
const statements=[];
for (const [source,values] of [['google-form',rows],['google-legacy-likes',legacy]]) {
  values.forEach((row,index)=>statements.push(`INSERT OR IGNORE INTO source_archive(source,row_number,private_json) VALUES(${sql(source)},${index+1},${sql(JSON.stringify(row))});`));
}
const imageKeys=new Set();
for (const item of snapshot.items) {
  const row=rows[item.imageIndex+1];
  if (!row || String(row[5]).trim() !== item.title || !row[2]) throw new Error(`Source mismatch for image index ${item.imageIndex}`);
  const oldImages=item.imageUrls || [item.imageUrl];
  const imageUrls=[];
  for (const path of oldImages) {
    if (!/^assets\/gallery\/[a-f0-9]{24}\.(png|jpg|webp|gif)$/.test(path)) throw new Error('Missing local screenshot');
    const bytes=await readFile(join(root,path));
    const data=bytes.toString('base64'), key=hash(data), mime='image/'+(path.endsWith('.jpg')?'jpeg':path.split('.').at(-1));
    imageUrls.push(`${base}/gallery-image?key=${key}`);
    if (!imageKeys.has(key)) for(let offset=0,part=0;offset<data.length;offset+=60000,part++)
      statements.push(`INSERT OR IGNORE INTO image_chunks(image_key,part,mime,data) VALUES(${sql(key)},${part},${sql(mime)},${sql(data.slice(offset,offset+60000))});`);
    imageKeys.add(key);
  }
  const migrated={...item,studentName:item.studentName.replaceAll(String(row[2]).trim(),'').trim(),imageUrls,imageUrl:imageUrls[0],notebookUrl:row[11] || ''};
  statements.push(`INSERT OR IGNORE INTO submissions(image_index,week,student_key,public_json) VALUES(${item.imageIndex},${item.week},${sql(hash(String(row[2]).trim().toLowerCase()))},${sql(JSON.stringify(migrated))});`);
  if (migrated.studentName !== item.studentName) statements.push(`UPDATE submissions SET public_json=json_set(public_json,'$.studentName',${sql(migrated.studentName)}) WHERE image_index=${item.imageIndex};`);
}
const weeks=[];
for (const file of (await readdir(join(root,'content/weeks'))).filter(f=>f.endsWith('.md')).sort()) {
  const text=await readFile(join(root,'content/weeks',file),'utf8');
  const field=name=>text.match(new RegExp(`^${name}: (.+)$`,'m'))?.[1];
  weeks.push({week:Number(field('week')),date:field('course_date'),opens:field('opens_at'),challenge:field('challenge_ja') || field('challenge')});
}
for (let i=0;i<weeks.length;i++) {
  const w=weeks[i], next=weeks[i+1]?.date || new Date(Date.parse(w.date+'T00:00:00Z')+7*86400000).toISOString().slice(0,10);
  const deadline=Date.parse(next+'T00:00:00+09:00')-60000;
  const opens=w.opens?Date.parse(w.opens):Date.parse(w.date+'T00:00:00+09:00')-86400000;
  statements.push(`INSERT OR REPLACE INTO week_schedule(week,challenge,opens_ms,deadline_ms) VALUES(${w.week},${sql(`第${w.week}週｜${w.challenge}`)},${opens},${deadline});`);
}
await writeFile(output,statements.join('\n')+'\n',{mode:0o600});
console.log(JSON.stringify({publicWorks:snapshot.items.length,formResponses:rows.length-1,legacyLikes:legacy.length-1,images:imageKeys.size,sqlStatements:statements.length}));
