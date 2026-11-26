import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { guides, regions } from '../guide-finder/index-data.mjs';
import { buildSearchIndex, searchGuides } from '../guide-finder/search.mjs';
import { update } from '../scripts/update-guide-finder.mjs';

const index = buildSearchIndex(guides);
const search = (query, region = '') => searchGuides(index, { query, region });
const read = (file) => readFileSync(new URL('../' + file, import.meta.url), 'utf8');

test('finder projections stay in sync with the public guide catalogs', () => {
  update('--check');
  assert.equal(guides.length, 10);
  assert.equal(regions.length, 22);
  const html = read('guide-finder/index.html');
  for (const { slug, tasks } of guides) {
    assert.ok(html.includes('href="../' + slug + '/"'), slug);
    for (const { id } of tasks) assert.ok(html.includes('href="../' + slug + '/#' + id + '"'), slug + ':' + id);
  }
});

test('search normalizes common wording and still opens the canonical task', () => {
  assert.equal(search('Can I bring an old microwave to a repair café?')[0].id, 'microwave');
  assert.equal(search('library can I scan 11 × 17?')[0].id, 'tabloid');
  assert.equal(search('can I return unused seeds?')[0].id, 'unused-seeds');
  assert.equal(search('dispose couch Milwaukee')[0].id, 'sofa-or-mattress');
});

test('location filtering and status operate on one named route without joining places', () => {
  const [eyes] = search('donate broken glasses', 'us-ga');
  assert.equal(eyes.id, 'broken-frames');
  assert.deepEqual(eyes.routes.map(({ id, fit }) => [id, fit]), [['georgia-lions', 'listed']]);
  const [lenses] = search('donate loose lenses', 'us-ga');
  assert.equal(lenses.routes[0].fit, 'ask');
  assert.deepEqual(search('Toronto Durham quiet room'), []);
  assert.deepEqual(search('quiet room', 'ca-ns'), []);
  assert.ok(search('', 'us-wi').every(({ routes }) => routes.every((r) => r.region === 'us-wi')));
});

test('search fields stay in the page, with an ordinary link list as the fallback', () => {
  const html = read('guide-finder/index.html');
  const app = read('guide-finder/app.mjs');
  assert.match(html, /id="finder"[^>]*hidden/);
  assert.doesNotMatch(html, /<form\b|<script[^>]*https:/);
  assert.doesNotMatch(app, /\bfetch\(|\bnavigator\.sendBeacon|localStorage|sessionStorage|innerHTML/);
  assert.match(app, /child\.textContent = value/);
  assert.deepEqual(search('', ''), []);
});
