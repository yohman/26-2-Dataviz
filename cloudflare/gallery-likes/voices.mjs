import { openTextEntry } from '../../voices/open-text.mjs';
const uuid = v => /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v || '');
const categories = new Set(['money','education','work','identity','access','environment','care','voice','other']);
const hash = async v => [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))].map(v=>v.toString(16).padStart(2,'0')).join('');
const text = (v,max) => typeof v==='string' && v.trim().length<=max ? v.trim() : null;
export async function voicesApi(request,env,browser,reply) {
  const db=env.COURSE_DB, url=new URL(request.url), method=request.method;
  if(!['GET','POST','PUT','PATCH'].includes(method)) return reply({error:'Method not allowed'},405);
  let body={};
  if(method!=='GET') {
    const raw=await request.text();
    if(raw.length>6000) return reply({error:'Too large'},413);
    try {body=JSON.parse(raw);} catch{return reply({error:'Invalid JSON'},400);}
    if(!body || typeof body!=='object') return reply({error:'Invalid request'},400);
  }
  if(method==='POST' && body.action==='create') {
    const title=text(body.title,100);
    if(!title) return reply({error:'A session title is required'},400);
    if(env.COMMENT_LIMITER && !(await env.COMMENT_LIMITER.limit({key:`voice-create:${browser}:${request.headers.get('CF-Connecting-IP')||''}`})).success) return reply({error:'Please wait before creating another session'},429);
    const code=crypto.randomUUID().replaceAll('-','').slice(0,8);
    const hostKey=crypto.randomUUID()+crypto.randomUUID();
    await db.prepare('INSERT INTO voice_rooms(code,title,host_hash) VALUES(?,?,?)').bind(code,title,await hash(hostKey)).run();
    return reply({code,title,hostKey},201);
  }
  const code=url.searchParams.get('room');
  if(!/^[a-f0-9]{8}$/.test(code||'')) return reply({error:'Invalid session code'},400);
  const room=await db.prepare('SELECT * FROM voice_rooms WHERE code=?').bind(code).first();
  if(!room) return reply({error:'Session not found'},404);
  const key=request.headers.get('X-Host-Key');
  const host=Boolean(key && key.length<200 && await hash(key)===room.host_hash);
  const publicRoom={code:room.code,title:room.title,open:Boolean(room.open),revision:room.revision};
  if(method==='GET') {
    if(url.searchParams.get('revision')===String(room.revision)) return reply({room:publicRoom,unchanged:true,host});
    const cursor=Number(url.searchParams.get('cursor')||0);
    if(!Number.isSafeInteger(cursor)||cursor<0) return reply({error:'Invalid cursor'},400);
    const rows=await db.prepare(`SELECT e.seq,e.id,e.headline,e.detail,e.change_text AS change,e.categories,e.reach,e.urgency,e.hidden,e.created_at AS createdAt,
      (SELECT COUNT(*) FROM voice_resonance r WHERE r.entry=e.id) AS resonance,
      EXISTS(SELECT 1 FROM voice_resonance r WHERE r.entry=e.id AND r.browser=?) AS mine
      FROM voice_entries e WHERE e.room=? AND e.seq>? ${host?'':'AND e.hidden=0'} ORDER BY e.seq LIMIT 501`).bind(browser,code,cursor).all();
    const items=rows.results.slice(0,500).map(e=>({...e,reach:e.reach||null,urgency:e.urgency||null,categories:JSON.parse(e.categories),mine:Boolean(e.mine),hidden:Boolean(e.hidden)}));
    return reply({room:publicRoom,items,nextCursor:rows.results.length>500?items.at(-1).seq:null,host});
  }
  if(method==='PATCH') {
    if(!host) return reply({error:'Host access required'},403);
    if(typeof body.open==='boolean') {
      await db.prepare('UPDATE voice_rooms SET open=?,revision=revision+1 WHERE code=?').bind(Number(body.open),code).run();
    } else if(uuid(body.id)&&typeof body.hidden==='boolean') {
      await db.batch([
        db.prepare('UPDATE voice_entries SET hidden=? WHERE room=? AND id=?').bind(Number(body.hidden),code,body.id),
        db.prepare('UPDATE voice_rooms SET revision=revision+1 WHERE code=?').bind(code)
      ]);
    } else return reply({error:'Invalid host action'},400);
    return reply({saved:true});
  }
  if(!uuid(body.id)) return reply({error:'Invalid entry ID'},400);
  if(method==='PUT') {
    if(typeof body.active!=='boolean') return reply({error:'Invalid reaction'},400);
    const entry=await db.prepare('SELECT id FROM voice_entries WHERE id=? AND room=? AND hidden=0').bind(body.id,code).first();
    if(!entry) return reply({error:'Entry not found'},404);
    await db.batch([
      db.prepare(body.active?'INSERT OR IGNORE INTO voice_resonance(entry,browser) VALUES(?,?)':'DELETE FROM voice_resonance WHERE entry=? AND browser=?').bind(body.id,browser),
      db.prepare('UPDATE voice_rooms SET revision=revision+1 WHERE code=?').bind(code)
    ]);
    return reply({saved:true});
  }
  if(!room.open) return reply({error:'This session is closed'},409);
  const plain=Object.hasOwn(body,'text');
  const open=plain?openTextEntry(body.text):null;
  if(plain&&!open)return reply({error:'Write a voice of 1–500 characters'},400);
  const headline=plain?open.headline:text(body.headline,90),detail=plain?open.detail:text(body.detail||'',500),change=plain?'':text(body.change||'',180);
  const chosen=plain?[]:body.categories,reach=plain?0:body.reach,urgency=plain?0:body.urgency;
  if(!plain&&(!headline || detail===null || change===null || !Array.isArray(chosen) || chosen.length<1 || chosen.length>2 || new Set(chosen).size!==chosen.length || chosen.some(c=>!categories.has(c)) || !Number.isInteger(reach)||reach<1||reach>3 || !Number.isInteger(urgency)||urgency<1||urgency>5)) return reply({error:'Check the submission fields'},400);
  if(env.COMMENT_LIMITER && !(await env.COMMENT_LIMITER.limit({key:`voice-post:${browser}`})).success) return reply({error:'Please wait before posting again'},429);
  const existing=await db.prepare('SELECT browser,room FROM voice_entries WHERE id=?').bind(body.id).first();
  if(existing && (existing.browser!==browser || existing.room!==code)) return reply({error:'Entry ID already used'},409);
  await db.batch([
    db.prepare('INSERT OR IGNORE INTO voice_entries(id,room,browser,headline,detail,change_text,categories,reach,urgency) VALUES(?,?,?,?,?,?,?,?,?)').bind(body.id,code,browser,headline,detail,change,JSON.stringify(chosen),reach,urgency),
    db.prepare('UPDATE voice_rooms SET revision=revision+1 WHERE code=?').bind(code)
  ]);
  return reply({saved:true},201);
}
