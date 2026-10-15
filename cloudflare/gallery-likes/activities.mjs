export function validActivity(body) {
  return body && body.week === 4 && Number.isInteger(body.groupNumber) && body.groupNumber >= 1 && body.groupNumber <= 30
    && ['members', 'title', 'description'].every(key => typeof body[key] === 'string' && body[key].trim() && body[key].length <= ({members:300,title:120,description:1500})[key])
    && Array.isArray(body.images) && body.images.length >= 1 && body.images.length <= 2
    && body.images.every(image => typeof image === 'string' && image.length < 520000 && /^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/=]+$/.test(image));
}
export async function activitiesApi(request, env, browser, reply) {
  const url = new URL(request.url);
  if (request.method === 'GET') {
    const week = Number(url.searchParams.get('week'));
    if (week !== 4) return reply({error:'Invalid week'},400);
    const result = await env.DB.prepare('SELECT group_number AS groupNumber, members, title, description, image_two IS NOT NULL AS hasSecondImage, updated_at AS updatedAt, browser_id = ? AS mine FROM activity_submissions WHERE week = ? ORDER BY group_number').bind(browser,week).all();
    return reply({items:result.results.map(row=>({...row,mine:Boolean(row.mine)}))});
  }
  if (request.method !== 'POST') return reply({error:'Method not allowed'},405);
  if (Number(request.headers.get('Content-Length')) > 1100000) return reply({error:'Images too large'},413);
  const raw = await request.text();
  if (raw.length > 1100000) return reply({error:'Images too large'},413);
  let body;
  try { body = JSON.parse(raw); } catch { return reply({error:'Invalid JSON'},400); }
  if (!validActivity(body)) return reply({error:'Check the group number, required fields, and images'},400);
  if (env.COMMENT_LIMITER && !(await env.COMMENT_LIMITER.limit({key:browser})).success) return reply({error:'Please wait a minute before submitting again'},429);
  // Retrying or revising from the same browser updates one group entry.
  // Another browser cannot overwrite an existing group's work.
  const result = await env.DB.prepare(`INSERT INTO activity_submissions (week,group_number,browser_id,members,title,description,image_one,image_two)
    VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(week,group_number) DO UPDATE SET
    members=excluded.members,title=excluded.title,description=excluded.description,image_one=excluded.image_one,image_two=excluded.image_two,updated_at=CURRENT_TIMESTAMP
    WHERE activity_submissions.browser_id=excluded.browser_id`).bind(body.week,body.groupNumber,browser,body.members.trim(),body.title.trim(),body.description.trim(),body.images[0],body.images[1]||null).run();
  if (!result.meta.changes) return reply({error:'This group number was submitted from another browser. Use the original browser to revise it, or check your group number.'},409);
  return reply({saved:true,groupNumber:body.groupNumber},201);
}
export async function activityImage(request, env, headers) {
  const url = new URL(request.url);
  const week = Number(url.searchParams.get('week')), group = Number(url.searchParams.get('group')), slot = Number(url.searchParams.get('slot')||1);
  if (request.method !== 'GET' || week !== 4 || !Number.isInteger(group) || group<1 || group>30 || ![1,2].includes(slot)) return new Response('Not found',{status:404});
  const row = await env.DB.prepare(`SELECT ${slot===1?'image_one':'image_two'} AS image FROM activity_submissions WHERE week=? AND group_number=?`).bind(week,group).first();
  if (!row?.image) return new Response('Not found',{status:404});
  const bytes = Uint8Array.from(atob(row.image.split(',')[1]),c=>c.charCodeAt(0));
  return new Response(bytes,{headers:{...headers,'Content-Type':'image/jpeg','Cache-Control':'public, max-age=60','X-Content-Type-Options':'nosniff'}});
}
