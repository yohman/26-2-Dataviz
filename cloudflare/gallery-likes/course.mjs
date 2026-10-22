const uuid = value => /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value || '');
export async function digest(value) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(v => v.toString(16).padStart(2,'0')).join('');
}
export function validateHomework(body) {
  if (!body || !Number.isInteger(body.week) || body.week < 1 || body.week > 14 || !uuid(body.requestId) || !uuid(body.revisionToken)) return false;
  if (!/^[A-Za-z0-9-]{6,32}$/.test(body.studentId || '')) return false;
  if (typeof body.studentName === 'string' && body.studentName.includes(body.studentId)) return false;
  for (const [key, max] of Object.entries({studentName:120,title:200,tools:500,description:8000,projectUrl:6000})) {
    if (typeof body[key] !== 'string' || !body[key].trim() || body[key].length > max) return false;
  }
  if (typeof body.notebookUrl !== 'string' || body.notebookUrl.length > 2000) return false;
  if (body.notebookUrl) {
    try { const u = new URL(body.notebookUrl); if (!['https:','http:'].includes(u.protocol) || u.username || u.password) return false; } catch { return false; }
  }
  return Array.isArray(body.images) && body.images.length >= 1 && body.images.length <= 2
    && body.images.every(value => typeof value === 'string' && value.length < 1100000 && /^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/=]+$/.test(value));
}
export async function galleryApi(request, env, reply) {
  const cursor = new URL(request.url).searchParams.get('cursor') || '-1';
  if (!/^-?\d{1,10}$/.test(cursor)) return reply({error:'Invalid cursor'},400);
  const rows = await env.COURSE_DB.prepare('SELECT image_index, week, public_json FROM submissions WHERE image_index > ? ORDER BY image_index LIMIT 251').bind(Number(cursor)).all();
  const page=rows.results.slice(0,250);
  const items = page.map(row => ({...JSON.parse(row.public_json),week:row.week,imageIndex:row.image_index}));
  return reply({items,nextCursor:rows.results.length>250?String(page.at(-1).image_index):null});
}
export async function courseImage(request, env, headers = {}) {
  const key = new URL(request.url).searchParams.get('key') || '';
  if (!/^[a-f0-9]{64}$/.test(key)) return new Response('Not found',{status:404});
  const rows = await env.COURSE_DB.prepare('SELECT mime, data FROM image_chunks WHERE image_key=? ORDER BY part').bind(key).all();
  if (!rows.results.length) return new Response('Not found',{status:404});
  const base64 = rows.results.map(row=>row.data).join('');
  const bytes = Uint8Array.from(atob(base64), c=>c.charCodeAt(0));
  return new Response(bytes,{headers:{...headers,'Content-Type':rows.results[0].mime,'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
}
export async function homeworkApi(request, env, browser, reply) {
  const week = Number(new URL(request.url).searchParams.get('week'));
  const schedule = await env.COURSE_DB.prepare('SELECT * FROM week_schedule WHERE week=?').bind(week).first();
  if (!schedule) return reply({error:'Invalid week'},400);
  const open = Date.now() >= schedule.opens_ms && Date.now() < schedule.deadline_ms;
  if (request.method === 'GET') return reply({week,challenge:schedule.challenge,opensAt:schedule.opens_ms,deadline:schedule.deadline_ms,open});
  if (request.method !== 'POST') return reply({error:'Method not allowed'},405);
  if (!open) return reply({error:'Submissions are closed for this week. / この週の提出受付は終了、または開始前です。'},403);
  if (Number(request.headers.get('Content-Length')) > 2300000) return reply({error:'Images too large'},413);
  // A classroom shares a campus IP: rate limit per browser, not per school.
  if (env.COMMENT_LIMITER && !(await env.COMMENT_LIMITER.limit({key:`homework:${browser}`})).success) return reply({error:'Please wait a minute and retry. / 1分ほど待って再試行してください。'},429);
  const raw = await request.text();
  if (raw.length > 2300000) return reply({error:'Images too large'},413);
  let body; try { body=JSON.parse(raw); } catch { return reply({error:'Invalid JSON'},400); }
  if (!validateHomework(body) || body.week !== week) return reply({error:'Check the required fields and images. / 必須項目と画像を確認してください。'},400);
  const previousRequest = await env.COURSE_DB.prepare('SELECT image_index, browser_id FROM submission_revisions WHERE request_id=?').bind(body.requestId).first();
  if (previousRequest) return previousRequest.browser_id === browser ? reply({saved:true,id:`${week}-${previousRequest.image_index}`}) : reply({error:'Request conflict'},409);
  const studentKey = await digest(body.studentId.trim().toLowerCase());
  const revisionHash = await digest(body.revisionToken);
  const existing = await env.COURSE_DB.prepare('SELECT image_index, browser_id, revision_hash FROM submissions WHERE week=? AND student_key=?').bind(week,studentKey).first();
  if (existing && existing.browser_id !== browser && existing.revision_hash !== revisionHash) return reply({error:'Use the original browser or your revision code to update this work. / 元のブラウザまたは保存した修正コードで更新してください。'},409);
  const statements=[], imageUrls=[];
  for (const image of body.images) {
    const data=image.split(',')[1], key=await digest(data);
    imageUrls.push(`${new URL(request.url).origin}/gallery-image?key=${key}`);
    for(let offset=0,part=0;offset<data.length;offset+=60000,part++) statements.push(env.COURSE_DB.prepare('INSERT OR IGNORE INTO image_chunks(image_key,part,mime,data) VALUES(?,?,?,?)').bind(key,part,'image/jpeg',data.slice(offset,offset+60000)));
  }
  const publicItem={challenge:schedule.challenge,studentName:body.studentName.trim(),title:body.title.trim(),tools:body.tools.trim(),projectUrl:body.projectUrl.trim(),description:body.description.trim(),notebookUrl:body.notebookUrl.trim(),submittedAt:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),imageCount:imageUrls.length,imageUrls,imageUrl:imageUrls[0]};
  statements.push(env.COURSE_DB.prepare(`INSERT INTO submissions(week,student_key,browser_id,revision_hash,public_json) VALUES(?,?,?,?,?)
    ON CONFLICT(week,student_key) DO UPDATE SET public_json=excluded.public_json,browser_id=excluded.browser_id,revision_hash=excluded.revision_hash,updated_at=CURRENT_TIMESTAMP
    WHERE submissions.browser_id=excluded.browser_id OR submissions.revision_hash=excluded.revision_hash`).bind(week,studentKey,browser,revisionHash,JSON.stringify(publicItem)));
  statements.push(env.COURSE_DB.prepare(`INSERT INTO submission_revisions(request_id,image_index,browser_id,private_json)
    SELECT ?,image_index,?,? FROM submissions WHERE week=? AND student_key=? AND browser_id=?`).bind(body.requestId,browser,JSON.stringify({...body,images:imageUrls,revisionToken:undefined}),week,studentKey,browser));
  await env.COURSE_DB.batch(statements);
  const result=await env.COURSE_DB.prepare('SELECT image_index FROM submission_revisions WHERE request_id=? AND browser_id=?').bind(body.requestId,browser).first();
  if (!result) return reply({error:'Submission conflict; use the original browser.'},409);
  return reply({saved:true,id:`${week}-${result.image_index}`},201);
}
