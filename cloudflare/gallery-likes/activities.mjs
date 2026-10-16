export function validActivity(body) {
  return body && body.week === 4 && typeof body.groupName === 'string' && body.groupName.trim() && body.groupName.length <= 80
    && validTableauUrl(body.tableauUrl)
    && ['members', 'title', 'description'].every(key => typeof body[key] === 'string' && body[key].trim() && body[key].length <= ({members:300,title:120,description:1500})[key])
    && Array.isArray(body.images) && body.images.length >= 1 && body.images.length <= 2
    && body.images.every(image => typeof image === 'string' && image.length < 520000 && /^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/=]+$/.test(image));
}
function validTableauUrl(value) {
  if (value === undefined || value === '') return true;
  if (typeof value !== 'string' || value.length > 2000) return false;
  try { const u=new URL(value); return u.protocol==='https:' && u.hostname==='public.tableau.com' && !u.username && !u.password; } catch { return false; }
}
export async function activitiesApi(request, env, browser, reply) {
  const url = new URL(request.url);
  if (request.method === 'GET') {
    const week = Number(url.searchParams.get('week'));
    if (week !== 4) return reply({error:'Invalid week'},400);
    const result = await env.DB.prepare('SELECT group_name AS groupName, members, title, description, tableau_url AS tableauUrl, image_two IS NOT NULL AS hasSecondImage, updated_at AS updatedAt, browser_id = ? AS mine FROM activity_submissions WHERE week = ? ORDER BY group_name COLLATE NOCASE').bind(browser,week).all();
    return reply({items:result.results.map(row=>({...row,mine:Boolean(row.mine)}))});
  }
  if (request.method !== 'POST') return reply({error:'Method not allowed'},405);
  if (Number(request.headers.get('Content-Length')) > 1100000) return reply({error:'Images too large'},413);
  const raw = await request.text();
  if (raw.length > 1100000) return reply({error:'Images too large'},413);
  let body;
  try { body = JSON.parse(raw); } catch { return reply({error:'Invalid JSON'},400); }
  if (!body || typeof body !== 'object') return reply({error:'Invalid submission'},400);
  if (!body.groupName && Number.isInteger(body.groupNumber)) body.groupName=String(body.groupNumber);
  if (typeof body.tableauUrl === 'string') body.tableauUrl=body.tableauUrl.trim();
  if (!validActivity(body)) return reply({error:'Check the group name, required fields, and images'},400);
  if (env.COMMENT_LIMITER && !(await env.COMMENT_LIMITER.limit({key:browser})).success) return reply({error:'Please wait a minute before submitting again'},429);
  // Retrying or revising from the same browser updates one group entry.
  // Another browser cannot overwrite an existing group's work.
  const result = await env.DB.prepare(`INSERT INTO activity_submissions (week,group_name,browser_id,members,title,description,image_one,image_two,tableau_url)
    VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(week,group_name) DO UPDATE SET
    members=excluded.members,title=excluded.title,description=excluded.description,image_one=excluded.image_one,image_two=excluded.image_two,tableau_url=excluded.tableau_url,updated_at=CURRENT_TIMESTAMP
    WHERE activity_submissions.browser_id=excluded.browser_id`).bind(body.week,body.groupName.trim(),browser,body.members.trim(),body.title.trim(),body.description.trim(),body.images[0],body.images[1]||null,body.tableauUrl||'').run();
  if (!result.meta.changes) return reply({error:'This group name was submitted from another browser. Use the original browser to revise it, or check your group name.'},409);
  return reply({saved:true,groupName:body.groupName},201);
}
export async function activityImage(request, env, headers) {
  const url = new URL(request.url);
  const week = Number(url.searchParams.get('week')), group = url.searchParams.get('group')?.trim(), slot = Number(url.searchParams.get('slot')||1);
  if (request.method !== 'GET' || week !== 4 || !group || group.length>80 || ![1,2].includes(slot)) return new Response('Not found',{status:404});
  const row = await env.DB.prepare(`SELECT ${slot===1?'image_one':'image_two'} AS image FROM activity_submissions WHERE week=? AND group_name=?`).bind(week,group).first();
  if (!row?.image) return new Response('Not found',{status:404});
  const bytes = Uint8Array.from(atob(row.image.split(',')[1]),c=>c.charCodeAt(0));
  return new Response(bytes,{headers:{...headers,'Content-Type':'image/jpeg','Cache-Control':'public, max-age=60','X-Content-Type-Options':'nosniff'}});
}
