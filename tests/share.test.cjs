const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const source = readFileSync('app.js', 'utf8');
const shareSource = source.slice(source.indexOf('  async function shareImage()'), source.indexOf('  async function choose('));
for (const scenario of ['supported', 'unsupported', 'cancelled', 'failed']) {
  test(`image sharing: ${scenario}`, async () => {
    let copied = 0, shared;
    const share = runInNewContext(`(async () => { ${shareSource}; await shareImage(); })`, {
      File, imageBlob: async () => new Blob(['PNG'], { type: 'image/png' }),
      navigator: { canShare: () => scenario !== 'unsupported', share: async data => {
        if (scenario === 'cancelled') throw { name: 'AbortError' };
        if (scenario === 'failed') throw { name: 'NotAllowedError' };
        shared = data.files[0];
      } }, copyLink: async () => copied++, showButtonFeedback: () => {}
    });
    await share();
    assert.equal(copied, ['unsupported', 'failed'].includes(scenario) ? 1 : 0);
    if (scenario === 'supported') { assert.equal(shared.type, 'image/png'); assert.equal(shared.name, 'my-pepero.png'); }
  });
}
