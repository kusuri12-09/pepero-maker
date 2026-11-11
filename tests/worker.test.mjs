import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import worker, { validCard } from '../worker.mjs';

const card = readFileSync(new URL('../public/og-image.png', import.meta.url));
function environment() {
  const images = new Map();
  return {
    images,
    UPLOAD_LIMIT: { limit: async () => ({ success: true }) },
    SHARES: { prepare(sql) { return { bind(id, image) { return {
      run: async () => images.set(id, new Uint8Array(image)),
      first: async () => images.has(id) ? sql.includes('SELECT image') ? { image: Array.from(images.get(id)) } : { id } : null
    }; } }; } },
    ASSETS: { fetch: async () => new Response('<meta property="og:image" content="/public/og-image.png">') }
  };
}
const upload = (body = card, headers = {}) => new Request('https://pepero.example/api/shares', { method: 'POST', headers: { 'Content-Type': 'image/png', ...headers }, body });

test('validates PNG dimensions, checksum and decompressed pixels', () => {
  assert.equal(validCard(card), true);
  assert.equal(validCard(Buffer.from('not PNG')), false);
  const bad = Buffer.from(card); bad[bad.length - 1] ^= 1;
  assert.equal(validCard(bad), false);
  assert.equal(validCard(card.subarray(0, 100)), false);
});

test('upload creates durable image and absolute crawler metadata', async () => {
  const env = environment();
  const response = await worker.fetch(upload(), env);
  assert.equal(response.status, 201);
  const { url } = await response.json();
  const page = await worker.fetch(new Request('https://pepero.example' + url), env);
  assert.match(await page.text(), new RegExp(`https://pepero.example${url}/image.png`));
  const image = await worker.fetch(new Request('https://pepero.example' + url + '/image.png'), env);
  assert.equal(image.headers.get('Content-Type'), 'image/png');
  assert.deepEqual(Buffer.from(await image.arrayBuffer()), card);
  const head = await worker.fetch(new Request('https://pepero.example' + url, { method: 'HEAD' }), env);
  assert.equal(head.status, 200); assert.equal(await head.text(), '');
});

test('rejects invalid, oversized, cross-origin and rate-limited uploads', async () => {
  const env = environment();
  assert.equal((await worker.fetch(upload('bad'), env)).status, 400);
  assert.equal((await worker.fetch(upload(card, { Origin: 'https://evil.example' }), env)).status, 403);
  assert.equal((await worker.fetch(upload(card, { 'Content-Type': 'text/html' }), env)).status, 415);
  assert.equal((await worker.fetch(upload(new Uint8Array(1024 * 1024 + 1)), env)).status, 413);
  env.UPLOAD_LIMIT.limit = async () => ({ success: false });
  assert.equal((await worker.fetch(upload(), env)).status, 429);
});

test('missing shares return 404 and home metadata uses deployment origin', async () => {
  const env = environment();
  assert.equal((await worker.fetch(new Request('https://pepero.example/share/' + '0'.repeat(32)), env)).status, 404);
  const page = await worker.fetch(new Request('https://pepero.example/'), env);
  assert.match(await page.text(), /https:\/\/pepero.example\/public\/og-image.png/);
});
