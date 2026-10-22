// Refresh the static failure fallback from Cloudflare. No Google dependency.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
const root=resolve(process.argv[2] || '.');
const feed=process.env.GALLERY_FEED_URL || 'https://dataviz-gallery-likes.ykawano.workers.dev/gallery';
const fields=['week','challenge','submittedAt','studentName','title','tools','projectUrl','description','notebookUrl','imageIndex','imageCount','imageUrls','imageUrl'];
let payload;
try {
  const items=[],seen=new Set();let cursor='';
  do {
    const url=new URL(feed);url.searchParams.set('t',Date.now());if(cursor)url.searchParams.set('cursor',cursor);
    const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(20000)});
    if(!response.ok)throw new Error(`Cloudflare gallery HTTP ${response.status}`);
    const page=await response.json();if(!Array.isArray(page.items))throw new Error('Invalid Cloudflare gallery');
    items.push(...page.items.map(item=>Object.fromEntries(fields.filter(key=>key in item).map(key=>[key,item[key]]))));
    cursor=page.nextCursor || '';if(cursor && seen.has(cursor))throw new Error('Repeated gallery cursor');seen.add(cursor);
  }while(cursor);
  if(!items.length)throw new Error('Gallery feed returned no submissions; preserving the published gallery');
  items.sort((a,b)=>b.week-a.week || a.studentName.localeCompare(b.studentName,'ja'));
  payload={generatedAt:new Date().toISOString(),items};
} catch(error) {
  const saved=JSON.parse(await readFile(join(root,'data/gallery-public.json'),'utf8'));
  if(!saved.items?.length)throw error;
  console.warn(`${error.message}; keeping the last good local snapshot.`);payload=saved;
}
const snapshot=JSON.stringify(payload).replaceAll('<','\\u003c');
await writeFile(join(root,'data/gallery-public.json'),snapshot+'\n');
for(const file of ['gallery.html','gallery-work.html']) {
  const html=await readFile(join(root,file),'utf8');
  const tag=`<script id="gallery-snapshot" type="application/json">${snapshot}</script>`;
  const updated=html.includes('id="gallery-snapshot"')?html.replace(/<script id="gallery-snapshot" type="application\/json">[\s\S]*?<\/script>/,()=>tag):html.replace('</body>',tag+'</body>');
  await writeFile(join(root,file),updated);
}
console.log(`Saved ${payload.items.length} Cloudflare gallery works.`);
