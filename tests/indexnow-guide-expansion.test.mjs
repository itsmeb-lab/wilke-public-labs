import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPIRES, MANIFEST, SUBMISSION_ID, URLS, notifyGuideRelease } from '../ops-indexnow/guide-expansion.mjs';
import { ENDPOINT, KEY, KEY_LOCATION, REPOSITORY } from '../ops-indexnow/submit-once.mjs';

const manifest = { id: SUBMISSION_ID, expiresAt: EXPIRES, urls: [...URLS] };
const context = { repository: REPOSITORY, event: 'push', ref: 'refs/heads/main', attempt: '1', changes: ['A\t' + MANIFEST] };

function stubs({ status = 202, breakKey = false, incomplete = false, interrupt = false } = {}) {
  const calls = [];
  return {
    calls,
    verify: async () => (incomplete ? URLS.slice(1) : URLS).map((url) => ({ url, status: 200 })),
    now: () => Date.parse(EXPIRES) - 2000,
    fetcher: async (url, options) => {
      calls.push({ url, options });
      if (url === KEY_LOCATION) return { url, status: 200, text: async () => breakKey ? 'other' : KEY };
      assert.equal(url, ENDPOINT);
      if (interrupt) throw new Error('one ambiguous transport response');
      return { status };
    },
  };
}

test('one POST includes only eight verified canonical pages', async () => {
  const stub = stubs();
  const result = await notifyGuideRelease(manifest, context, stub);
  assert.equal(result.httpStatus, 202);
  assert.equal(result.indexingVerified, false);
  assert.deepEqual(stub.calls.map((x) => x.url), [KEY_LOCATION, ENDPOINT]);
  assert.equal(stub.calls[1].options.method, 'POST');
  assert.deepEqual(JSON.parse(stub.calls[1].options.body).urlList, URLS);
  assert.equal(new Set(URLS).size, 8);
});

test('rejects old, edited, expired, off-branch and rerun triggers', async () => {
  const options = stubs();
  await assert.rejects(() => notifyGuideRelease({ ...manifest, id: 'community-guides-20261125' }, context, options), /differs/);
  await assert.rejects(() => notifyGuideRelease(manifest, { ...context, changes: ['M\t' + MANIFEST] }, options), /add-only/);
  await assert.rejects(() => notifyGuideRelease(manifest, { ...context, attempt: '2' }, options), /first push/);
  await assert.rejects(() => notifyGuideRelease(manifest, { ...context, ref: 'refs/heads/other' }, options), /canonical repository/);
  await assert.rejects(() => notifyGuideRelease(manifest, context, { ...options, now: () => Date.parse(EXPIRES) }), /expired/);
  assert.equal(options.calls.length, 0);
});

test('fails before POST when a live page or key cannot be verified', async () => {
  const missing = stubs({ incomplete: true });
  await assert.rejects(() => notifyGuideRelease(manifest, context, missing), /could not be confirmed/);
  assert.equal(missing.calls.length, 0);
  const wrongKey = stubs({ breakKey: true });
  await assert.rejects(() => notifyGuideRelease(manifest, context, wrongKey), /did not match/);
  assert.equal(wrongKey.calls.length, 1);
});

test('a network interruption leaves the receipt unknown without retrying', async () => {
  const stub = stubs({ interrupt: true });
  const result = await notifyGuideRelease(manifest, context, stub);
  assert.equal(result.httpStatus, null);
  assert.equal(result.outcome, 'unknown');
  assert.equal(stub.calls.filter((call) => call.url === ENDPOINT).length, 1);
});
