import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { comparisonGuides, checkRobots, checkServed } from './review-comparisons.mjs';
import { compileDataset } from './update-comparison-data.mjs';

const served = await checkServed();
const robots = await checkRobots();
const sitemap = readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
const canonicals = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((entry) => entry[1]);
const dataset = compileDataset();
assert.equal(served.length, 53);
assert.equal(robots.status === 200 || robots.status === 404, true);
assert.equal(canonicals.length, 23);
assert.equal(new Set(canonicals).size, canonicals.length);
assert.equal(comparisonGuides.length, 15);
assert.equal(dataset.snapshot.guide_count, 15);
assert.equal(dataset.snapshot.record_count, 480);
assert.ok(dataset.records.every(({ answer_url }) => canonicals.includes(answer_url.split('#')[0])));
const feed = readFileSync(new URL('../guide-updates.xml', import.meta.url), 'utf8');
const itemLinks = [...feed.matchAll(/<item>[\s\S]+?<link>([^<]+)<\/link>/g)].map((entry) => entry[1]);
assert.equal(itemLinks.length, 13);
assert.equal(new Set(itemLinks).size, itemLinks.length);
assert.ok(itemLinks.every((url) => canonicals.includes(url)));
console.log('LIVE_EXPANSION_RECEIPT ' + JSON.stringify({
  checkedAt: new Date().toISOString(),
  revision: process.env.GITHUB_SHA,
  publicUrls: served.length,
  exactCanonicalPages: canonicals.length,
  robots,
  feedItems: itemLinks.length,
  data: dataset.snapshot,
  urls: served.map(({ url, status, bytes, contentType }) => ({ url, status, bytes, contentType })),
}));
