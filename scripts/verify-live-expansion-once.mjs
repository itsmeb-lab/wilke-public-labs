import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { comparisonGuides, checkRobots, checkServed } from './review-comparisons.mjs';
import { compileDataset } from './update-comparison-data.mjs';

const served = await checkServed();
const robots = await checkRobots();
const sitemap = readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
const canonicals = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((entry) => entry[1]);
const dataset = compileDataset();
assert.equal(served.length, 46);
assert.equal(robots.status === 200 || robots.status === 404, true);
assert.equal(canonicals.length, 20);
assert.equal(new Set(canonicals).size, canonicals.length);
assert.equal(comparisonGuides.length, 12);
assert.equal(dataset.snapshot.guide_count, 12);
assert.equal(dataset.snapshot.record_count, 379);
assert.ok(dataset.records.every(({ answer_url }) => canonicals.includes(answer_url.split('#')[0])));
console.log('LIVE_EXPANSION_RECEIPT ' + JSON.stringify({
  checkedAt: new Date().toISOString(),
  revision: process.env.GITHUB_SHA,
  publicUrls: served.length,
  exactCanonicalPages: canonicals.length,
  robots,
  data: dataset.snapshot,
  urls: served.map(({ url, status, bytes, contentType }) => ({ url, status, bytes, contentType })),
}));
