export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store',
      Vary: 'Origin', 'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Browser-ID', 'Access-Control-Max-Age': '86400' };
    const reply = (data, status = 200) => new Response(JSON.stringify(data), { status, headers });
    if (!(env.ALLOWED_ORIGINS || '').split(',').includes(origin)) return reply({ error: 'Origin not allowed' }, 403);
    headers['Access-Control-Allow-Origin'] = origin;
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    const browser = request.headers.get('X-Browser-ID');
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(browser || '')) return reply({ error: 'Invalid browser ID' }, 400);
    if (new URL(request.url).pathname !== '/likes') return reply({ error: 'Not found' }, 404);
    try {
      if (request.method === 'GET') {
        const result = await env.DB.prepare('SELECT submission_id AS id, COUNT(*) AS count, MAX(browser_id = ?) AS liked FROM likes GROUP BY submission_id').bind(browser).all();
        return reply({ items: result.results.map(row => ({ ...row, liked: Boolean(row.liked) })) });
      }
      if (request.method !== 'PUT') return reply({ error: 'Method not allowed' }, 405);
      if (Number(request.headers.get('Content-Length')) > 512) return reply({ error: 'Too large' }, 413);
      const text = await request.text();
      if (text.length > 512) return reply({ error: 'Too large' }, 413);
      let body;
      try { body = JSON.parse(text); } catch { return reply({ error: 'Invalid JSON' }, 400); }
      if (!/^(?:[1-9]|1[0-4])-\d{1,7}$/.test(body?.id || '') || typeof body?.liked !== 'boolean') return reply({ error: 'Invalid like' }, 400);
      // Explicit desired state and a unique key make retried writes safe.
      const mutation = body.liked
        ? 'INSERT OR IGNORE INTO likes (submission_id, browser_id) VALUES (?, ?)'
        : 'DELETE FROM likes WHERE submission_id = ? AND browser_id = ?';
      const result = await env.DB.batch([
        env.DB.prepare(mutation).bind(body.id, browser),
        env.DB.prepare('SELECT COUNT(*) AS count, COALESCE(MAX(browser_id = ?), 0) AS liked FROM likes WHERE submission_id = ?').bind(browser, body.id)
      ]);
      const row = result[1].results[0];
      return reply({ id: body.id, count: row.count, liked: Boolean(row.liked) });
    } catch { return reply({ error: 'Likes temporarily unavailable' }, 503); }
  }
};
