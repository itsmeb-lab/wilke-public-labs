import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { checkServed, checkRobots, sourceImpact, sourcesReviewedBefore } from '../scripts/review-comparisons.mjs';

const root = new URL('../', import.meta.url);
const base = 'https://itsmeb-lab.github.io/wilke-public-labs/';
const fakeResponse = (request, init) => {
  assert.equal(init.redirect, 'error');
  assert.ok(init.signal instanceof AbortSignal);
  assert.ok(request.href.startsWith(base));
  const relative = request.pathname.slice(new URL(base).pathname.length);
  const path = !relative || relative.endsWith('/') ? relative + 'index.html' : relative;
  return {
    ok: true, status: 200, url: request.href,
    headers: new Headers({ 'content-type': path.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' }),
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
  assert.equal(reads.length, 50);
  assert.ok(reads.some((entry) => entry.url === base));
  assert.ok(reads.some((entry) => entry.url === base + 'published-policy-lab/wood-chip-load.mjs?v=20261125-1'));
  assert.ok(reads.some((entry) => entry.url === base + 'milwaukee-bulky-items/comparison.csv'));
  assert.ok(reads.every((entry) => entry.status === 200 && entry.bytes > 100));
});

test('an unrelated destination, missing output, or different content fails deployment verification', async () => {
  await assert.rejects(checkServed(async (url) => ({ ...fakeResponse(url, { redirect: 'error', signal: new AbortController().signal }), url: 'https://example.org/' })), /Unexpected response/);
  await assert.rejects(checkServed(async (url) => ({ ok: false, status: 404, url: url.href })), /HTTP 404/);
  await assert.rejects(checkServed(async (url, init) => ({ ...fakeResponse(url, init), text: async () => 'outdated' })), /Served content differs/);
});

test('source review date cutoff is exclusive and uses each source’s review date', () => {
  assert.deepEqual(sourcesReviewedBefore('2026-11-25'), []);
  const items = sourcesReviewedBefore('2026-11-26');
  assert.equal(items.length, 82);
  assert.ok(items.every((item) => item.checkedOn === '2026-11-25' && item.page.startsWith(base)));
  assert.throws(() => sourcesReviewedBefore('2026-02-30'), /real calendar date/);
});

test('a valid byte match with a noindex response is flagged separately', async () => {
  await assert.rejects(checkServed(async (url, init) => {
    const response = fakeResponse(url, init);
    response.headers.set('x-robots-tag', 'noindex');
    return response;
  }), /Indexing exclusion/);
});

test('robots lookup uses the origin root and reports the received directives', async () => {
  const result = await checkRobots(async (url, init) => {
    assert.equal(url.href, 'https://itsmeb-lab.github.io/robots.txt');
    assert.equal(init.redirect, 'error');
    return { url: url.href, status: 200, ok: true, text: async () => '# comment\nUser-agent: *\nDisallow: /example/\n' };
  });
  assert.deepEqual(result.directives, ['User-agent: *', 'Disallow: /example/']);
  assert.deepEqual((await checkRobots(async (url) => ({ url: url.href, status: 404 }))).directives, []);
});
