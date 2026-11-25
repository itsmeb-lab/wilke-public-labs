import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { checkServed, sourceImpact } from '../scripts/review-comparisons.mjs';

const root = new URL('../', import.meta.url);
const base = 'https://itsmeb-lab.github.io/wilke-public-labs/';
const fakeResponse = (request, init) => {
  assert.equal(init.redirect, 'error');
  assert.ok(init.signal instanceof AbortSignal);
  assert.ok(request.href.startsWith(base));
  const relative = request.href.slice(base.length);
  const path = relative.endsWith('/') ? relative + 'index.html' : relative;
  return {
    ok: true, status: 200, url: request.href,
    text: async () => readFileSync(new URL(path, root), 'utf8'),
  };
};

test('source review reports joined rules, preparation, and unresolved rows using the same operator link', () => {
  const report = sourceImpact('https://repaircafesf.org/faq#visit');
  assert.equal(report.source, 'https://repaircafesf.org/faq');
  assert.equal(report.matches.length, 1);
  const [page] = report.matches;
  assert.ok(page.citedRules.some((rule) => rule.operator === 'san-francisco' && rule.task === 'microwave'));
  assert.ok(page.preparation.some((step) => step.operator === 'san-francisco' && step.step === 'Parts'));
  assert.deepEqual(page.routeLinks, [{ operator: 'san-francisco', unresolvedItems: ['ebike-electrical'] }]);
  assert.equal(page.staticCitations, 0);
});

test('source review includes a related municipal link in the editorial notes', () => {
  const url = 'https://wauwatosa.gov/departments/public-works/collection-services/special-collection/';
  const [page] = sourceImpact(url).matches;
  assert.deepEqual([...new Set(page.citedRules.map((rule) => rule.operator))], ['wauwatosa-curb']);
  assert.equal(page.staticCitations, 1);
});

test('source review finds an alternate mentioned only in the page notes', () => {
  const url = 'https://city.milwaukee.gov/recycle/Reduce-Reuse/Donating';
  const [page] = sourceImpact(url).matches;
  assert.equal(page.page, base + 'milwaukee-bulky-items/');
  assert.equal(page.staticCitations, 1);
  assert.deepEqual(page.citedRules, []);
  assert.deepEqual(page.routeLinks, []);
  assert.deepEqual(sourceImpact('https://example.org/').matches, []);
  assert.throws(() => sourceImpact('https://username:secret@example.org/'), /original HTTPS/);
});

test('release verification reads only the exact canonical pages, downloads and sitemap', async () => {
  const reads = await checkServed(fakeResponse);
  assert.equal(reads.length, 11);
  assert.ok(reads.some((entry) => entry.url === base + 'milwaukee-bulky-items/comparison.csv'));
  assert.ok(reads.every((entry) => entry.status === 200 && entry.bytes > 100));
});

test('an unrelated destination, missing output, or different content fails deployment verification', async () => {
  await assert.rejects(checkServed(async (url) => ({ ...fakeResponse(url, { redirect: 'error', signal: new AbortController().signal }), url: 'https://example.org/' })), /Unexpected response/);
  await assert.rejects(checkServed(async (url) => ({ ok: false, status: 404, url: url.href })), /HTTP 404/);
  await assert.rejects(checkServed(async (url, init) => ({ ...fakeResponse(url, init), text: async () => 'outdated' })), /Served content differs/);
});
