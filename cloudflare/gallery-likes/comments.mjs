const validSubmission = value => /^(?:[1-9]|1[0-4])-\d{1,7}$/.test(value || '');
const validId = value => /^[a-f0-9-]{36}$/i.test(value || '');

export async function commentsApi(request, env, browser, reply) {
  const url = new URL(request.url);
  if (request.method === 'GET') {
    const submission = url.searchParams.get('submission');
    if (!submission) {
      const result = await env.DB.prepare('SELECT submission_id AS id, COUNT(*) AS count FROM comments GROUP BY submission_id').all();
      return reply({ items: result.results });
    }
    if (!validSubmission(submission)) return reply({ error: 'Invalid submission' }, 400);
    const cursor = url.searchParams.get('cursor') || '';
    if (cursor && !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\|[a-f0-9-]{36}$/i.test(cursor)) return reply({ error: 'Invalid cursor' }, 400);
    const [time = '', id = ''] = cursor.split('|');
    const rows = await env.DB.prepare(`SELECT id, author, body, created_at AS createdAt, browser_id = ? AS mine
      FROM comments WHERE submission_id = ? AND (created_at > ? OR (created_at = ? AND id > ?))
      ORDER BY created_at, id LIMIT 51`).bind(browser, submission, time, time, id).all();
    const items = rows.results.slice(0, 50).map(row => ({ ...row, mine: Boolean(row.mine) }));
    const last = items.at(-1);
    return reply({ items, nextCursor: rows.results.length > 50 ? `${last.createdAt}|${last.id}` : null });
  }
  if (!['POST', 'DELETE'].includes(request.method)) return reply({ error: 'Method not allowed' }, 405);
  if (Number(request.headers.get('Content-Length')) > 8000) return reply({ error: 'Too large' }, 413);
  const raw = await request.text();
  if (raw.length > 8000) return reply({ error: 'Too large' }, 413);
  let body;
  try { body = JSON.parse(raw); } catch { return reply({ error: 'Invalid JSON' }, 400); }
  if (!validId(body?.id)) return reply({ error: 'Invalid comment ID' }, 400);
  if (request.method === 'DELETE') {
    const result = await env.DB.prepare('DELETE FROM comments WHERE id = ? AND browser_id = ?').bind(body.id, browser).run();
    return reply({ deleted: Boolean(result.meta.changes) });
  }
  const author = typeof body.author === 'string' ? body.author.trim() : '';
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  if (!validSubmission(body.submission) || !author || author.length > 60 || !text || text.length > 1500) return reply({ error: 'Name or comment is invalid' }, 400);
  if (env.COMMENT_LIMITER && !(await env.COMMENT_LIMITER.limit({ key: browser })).success) return reply({ error: 'Please wait before posting another comment' }, 429);
  // A client-generated ID makes retrying a timed-out submission idempotent.
  await env.DB.prepare('INSERT OR IGNORE INTO comments (id, submission_id, browser_id, author, body) VALUES (?, ?, ?, ?, ?)').bind(body.id, body.submission, browser, author, text).run();
  return reply({ saved: true }, 201);
}
