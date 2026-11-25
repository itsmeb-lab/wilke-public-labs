import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ENDPOINT, KEY, KEY_LOCATION, REPOSITORY } from '../ops-indexnow/submit-once.mjs';
import { EXPIRES, MANIFEST, SUBMISSION_ID, URLS, notifyGuideRelease } from '../ops-indexnow/guide-release.mjs';

const manifest = { expiresAt: EXPIRES, id: SUBMISSION_ID, urls: [...URLS] };
const event = { repository: REPOSITORY, event: 'push', ref: 'refs/heads/main', attempt: '1', changes: ['A\t' + MANIFEST] };
const clock = () => Date.parse(EXPIRES) - 60000;
const live = () => URLS.map((url) => ({ url, status: 200 }));

test('the changed six verified guides are sent once to the global endpoint', async () => {
  const calls = [];
  const receipt = await notifyGuideRelease(manifest, event, {
    verify: live,
    now: clock,
    fetcher: async (address, options) => {
      calls.push([address, options]);
      return address === KEY_LOCATION ? { status: 200, url: address, text: async () => KEY } : { status: 202 };
    },
  });
  assert.equal(receipt.httpStatus, 202);
  assert.equal(receipt.indexingVerified, false);
  assert.equal(receipt.automaticRetries, 0);
  assert.deepEqual(calls.map(([url]) => url), [KEY_LOCATION, ENDPOINT]);
  assert.deepEqual(JSON.parse(calls[1][1].body).urlList, URLS);
  assert.equal(calls[1][1].method, 'POST');
});

test('expired, repeated or substituted guide batches cannot reach the network', async () => {
  const failFetch = () => assert.fail('Network must not be reached');
  const options = { verify: failFetch, fetcher: failFetch, now: clock };
  await assert.rejects(notifyGuideRelease(manifest, { ...event, attempt: '2' }, options), /first push/);
  await assert.rejects(notifyGuideRelease(manifest, { ...event, changes: ['M\t' + MANIFEST] }, options), /add-only/);
  await assert.rejects(notifyGuideRelease({ ...manifest, urls: [URLS[0], ...URLS.slice(0, -1)] }, event, options), /six canonical/);
  await assert.rejects(notifyGuideRelease(manifest, event, { ...options, now: () => Date.parse(EXPIRES) }), /expired/);
});

test('a missing live guide or wrong ownership body stops before the POST', async () => {
  await assert.rejects(notifyGuideRelease(manifest, event, {
    verify: () => live().slice(1), now: clock, fetcher: () => assert.fail('Ownership fetch must wait for validation'),
  }), /exact live guide/);
  await assert.rejects(notifyGuideRelease(manifest, event, {
    verify: live, now: clock, fetcher: async (url) => {
      assert.equal(url, KEY_LOCATION);
      return { url, status: 200, text: async () => 'wrong' };
    },
  }), /ownership file/);
});

test('transport uncertainty records a single attempt and never establishes indexing', async () => {
  let posts = 0;
  const result = await notifyGuideRelease(manifest, event, {
    verify: live, now: clock, fetcher: async (address) => {
      if (address === KEY_LOCATION) return { status: 200, url: address, text: async () => KEY };
      posts += 1;
      throw new Error('transport interrupted');
    },
  });
  assert.equal(posts, 1);
  assert.equal(result.outcome, 'unknown');
  assert.equal(result.httpStatus, null);
  assert.equal(result.indexingVerified, false);
});
