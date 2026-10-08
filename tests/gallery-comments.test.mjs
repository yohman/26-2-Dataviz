import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare/gallery-likes/worker.mjs';
const origin = 'http://127.0.0.1:8766';
const browser = '00000000-0000-4000-8000-000000000001';
const headers = { Origin: origin, 'X-Browser-ID': browser, 'Content-Type': 'application/json' };
const req = (method, body, query = '') => new Request('https://test/comments' + query, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
test('comments reject invalid names, identifiers and oversized text', async () => {
  for (const body of [
    { id: 'bad' },
    { id: browser, submission: '2-79', author: ' ', body: 'text' },
    { id: browser, submission: '2-79', author: 'Name', body: 'x'.repeat(1501) }
  ]) assert.equal((await worker.fetch(req('POST', body), { ALLOWED_ORIGINS: origin })).status, 400);
});
test('deletion is scoped to the requesting browser identity', async () => {
  let sql, values;
  const DB = { prepare(query) { sql = query; return { bind(...args) { values = args; return { run: async () => ({ meta: { changes: 0 } }) }; } }; } };
  const response = await worker.fetch(req('DELETE', { id: browser }), { ALLOWED_ORIGINS: origin, DB });
  assert.match(sql, /id = \? AND browser_id = \?/);
  assert.deepEqual(values, [browser, browser]);
  assert.deepEqual(await response.json(), { deleted: false });
});
test('posting rate limits return a retryable response', async () => {
  const response = await worker.fetch(req('POST', { id: browser, submission: '2-79', author: 'Name', body: 'Text' }), {
    ALLOWED_ORIGINS: origin, COMMENT_LIMITER: { limit: async () => ({ success: false }) }
  });
  assert.equal(response.status, 429);
});
