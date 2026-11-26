import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPIRES, MANIFEST, SUBMISSION_ID, URLS, notifyGuideRelease } from '../ops-indexnow/guide-followup.mjs';
import { URLS as sentEarlier } from '../ops-indexnow/guide-expansion.mjs';
import { ENDPOINT, KEY, KEY_LOCATION, REPOSITORY } from '../ops-indexnow/submit-once.mjs';

const manifest = { id: SUBMISSION_ID, expiresAt: EXPIRES, urls: [...URLS] };
const context = { repository: REPOSITORY, event: 'push', ref: 'refs/heads/main', attempt: '1', changes: ['A\t' + MANIFEST] };

test('the follow-up notice contains only the five later canonical URLs', async () => {
  assert.equal(new Set(URLS).size, 5);
  assert.ok(URLS.every((url) => !sentEarlier.includes(url)));
  const requests = [];
  const result = await notifyGuideRelease(manifest, context, {
    now: () => Date.parse(EXPIRES) - 1,
    verify: async () => URLS.map((url) => ({ url, status: 200 })),
    fetcher: async (url, options) => {
      requests.push({ url, method: options.method ?? 'GET' });
      if (url === KEY_LOCATION) return { url, status: 200, text: async () => KEY };
      assert.equal(url, ENDPOINT);
      assert.deepEqual(JSON.parse(options.body).urlList, URLS);
      return { status: 200 };
    },
  });
  assert.deepEqual(requests, [{ url: KEY_LOCATION, method: 'GET' }, { url: ENDPOINT, method: 'POST' }]);
  assert.equal(result.httpStatus, 200);
  assert.equal(result.indexingVerified, false);
});

test('wrong manifests and expiry fail before checking the site or making a request', async () => {
  const never = async () => { throw new Error('Unexpected request'); };
  const options = { now: () => Date.parse(EXPIRES) - 1, verify: never, fetcher: never };
  await assert.rejects(() => notifyGuideRelease({ ...manifest, urls: [...sentEarlier] }, context, options), /differs/);
  await assert.rejects(() => notifyGuideRelease(manifest, { ...context, changes: ['A\tops-indexnow/community-guides-20261125.json'] }, options), /add-only/);
  await assert.rejects(() => notifyGuideRelease(manifest, context, { ...options, now: () => Date.parse(EXPIRES) }), /expired/);
});
