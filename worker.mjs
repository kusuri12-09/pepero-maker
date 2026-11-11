import { inflateSync } from 'node:zlib';
import { Buffer } from 'node:buffer';

const MAX_UPLOAD = 1024 * 1024;
const crcTable = Uint32Array.from({ length: 256 }, (_, value) => {
  for (let i = 0; i < 8; i++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

export function validCard(bytes) {
  try {
    const data = Buffer.from(bytes);
    if (data.length > MAX_UPLOAD || data.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') return false;
    let offset = 8, header = false, ended = false;
    const compressed = [];
    let channels;
    while (offset + 12 <= data.length) {
      const size = data.readUInt32BE(offset);
      if (offset + size + 12 > data.length) return false;
      const kind = data.toString('ascii', offset + 4, offset + 8);
      let crc = 0xffffffff;
      for (let i = offset + 4; i < offset + 8 + size; i++) crc = crcTable[(crc ^ data[i]) & 255] ^ (crc >>> 8);
      if (((crc ^ 0xffffffff) >>> 0) !== data.readUInt32BE(offset + 8 + size)) return false;
      if (!header) {
        if (kind !== 'IHDR' || size !== 13 || data.readUInt32BE(offset + 8) !== 1200 || data.readUInt32BE(offset + 12) !== 630) return false;
        if (data[offset + 16] !== 8 || ![2, 6].includes(data[offset + 17]) || data[offset + 18] || data[offset + 19] || data[offset + 20]) return false;
        channels = data[offset + 17] === 6 ? 4 : 3;
        header = true;
      } else if (kind === 'IDAT') compressed.push(data.subarray(offset + 8, offset + 8 + size));
      else if (kind === 'IEND') {
        if (size !== 0 || offset + 12 !== data.length) return false;
        ended = true;
      } else if (kind === 'IHDR' || /^[A-Z]/.test(kind)) return false;
      offset += size + 12;
    }
    if (!ended || !compressed.length) return false;
    const row = 1200 * channels + 1;
    const pixels = inflateSync(Buffer.concat(compressed), { maxOutputLength: row * 630 });
    if (pixels.length !== row * 630) return false;
    for (let i = 0; i < pixels.length; i += row) if (pixels[i] > 4) return false;
    return true;
  } catch { return false; }
}

const reply = (text, status = 200, type = 'text/plain; charset=utf-8', extra = {}) => new Response(text, { status, headers: { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', ...extra } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/shares') {
      if (request.method !== 'POST') return reply('Method not allowed', 405);
      if (request.headers.get('Origin') && request.headers.get('Origin') !== url.origin) return reply('Forbidden', 403);
      if (!(await env.UPLOAD_LIMIT.limit({ key: request.headers.get('CF-Connecting-IP') || 'local' })).success) return reply('잠시 후 다시 공유해 주세요.', 429);
      if (request.headers.get('Content-Type')?.split(';')[0] !== 'image/png') return reply('PNG required', 415);
      if (Number(request.headers.get('Content-Length')) > MAX_UPLOAD) return reply('Image too large', 413);
      const reader = request.body?.getReader();
      if (!reader) return reply('Image required', 400);
      const chunks = [];
      let size = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > MAX_UPLOAD) { await reader.cancel(); return reply('Image too large', 413); }
        chunks.push(value);
      }
      const image = Buffer.concat(chunks);
      if (!validCard(image)) return reply('Invalid card', 400);
      const id = crypto.randomUUID().replaceAll('-', '');
      await env.SHARES.prepare('INSERT INTO shares (id, image) VALUES (?, ?)').bind(id, image.buffer.slice(image.byteOffset, image.byteOffset + image.byteLength)).run();
      return reply(JSON.stringify({ url: `/share/${id}` }), 201, 'application/json');
    }
    const match = url.pathname.match(/^\/share\/([a-f0-9]{32})(\/image.png)?$/);
    if (match) {
      if (!['GET', 'HEAD'].includes(request.method)) return reply('Method not allowed', 405);
      const key = match[1];
      if (match[2]) {
        const object = await env.SHARES.prepare('SELECT image FROM shares WHERE id = ?').bind(key).first();
        if (!object) return reply('Not found', 404);
        return reply(request.method === 'HEAD' ? null : new Uint8Array(object.image), 200, 'image/png', { 'Cache-Control': 'public, max-age=31536000, immutable' });
      }
      if (!await env.SHARES.prepare('SELECT id FROM shares WHERE id = ?').bind(key).first()) return reply('Not found', 404);
      const shareUrl = `${url.origin}/share/${match[1]}`;
      const imageUrl = `${shareUrl}/image.png`;
      const page = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>나만의 빼빼로 만들기</title>
<meta property="og:type" content="website"><meta property="og:title" content="나만의 빼빼로 만들기">
<meta property="og:url" content="${shareUrl}"><meta property="og:image" content="${imageUrl}">
<meta name="description" content="나도 만들어보기"><meta property="og:description" content="나도 만들어보기">
<meta name="twitter:title" content="나만의 빼빼로 만들기"><meta name="twitter:description" content="나도 만들어보기">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${imageUrl}">
<script>location.replace('/');</script></head><body><a href="/">나도 만들어보기</a></body></html>`;
      return reply(request.method === 'HEAD' ? null : page, 200, 'text/html; charset=utf-8');
    }
    if (url.pathname.startsWith('/share/') || url.pathname.startsWith('/api/')) return reply('Not found', 404);
    const response = await env.ASSETS.fetch(request);
    if (url.pathname !== '/' || response.status !== 200) return response;
    const page = (await response.text()).replaceAll('content="/public/og-image.png"', `content="${url.origin}/public/og-image.png"`);
    return reply(request.method === 'HEAD' ? null : page, 200, 'text/html; charset=utf-8');
  }
};
