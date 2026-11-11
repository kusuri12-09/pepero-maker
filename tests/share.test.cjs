const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const source = readFileSync('app.js', 'utf8');
const shareSource = source.slice(source.indexOf('  async function shareImage()'), source.indexOf('  async function choose('));
for (const ok of [true, false]) {
 test(`meta card upload ${ok ? 'success' : 'failure'}`, async () => {
  let copied, request;
  const brush = new Proxy({ measureText: () => ({ width: 200 }) }, { get: (target,key) => target[key] ?? (() => {}) });
  const share = runInNewContext(`(async () => { ${shareSource}; await shareImage(); })`, {
   imageBlob: async () => {}, canvas: {}, URL,
   location: { origin: 'http://localhost:4173' },
   document: { fonts: { load: async () => {} }, createElement: () => ({ getContext: () => brush, toBlob: callback => callback(new Blob(['PNG'], {type:'image/png'})) }) },
   fetch: async (url, options) => { request = {url,options}; return {ok, json: async () => ({url:'/share/abc'})}; },
   copyLink: async url => { copied = url; }
  });
  if (ok) { await share(); assert.equal(copied,'http://localhost:4173/share/abc'); }
  else { await assert.rejects(share(), /공유 링크 생성 실패/); assert.equal(copied,undefined); }
  assert.equal(request.url,'/api/shares');
  assert.equal(request.options.body.type,'image/png');
 });
}
