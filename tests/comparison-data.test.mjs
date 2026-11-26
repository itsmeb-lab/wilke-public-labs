import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { compileDataset, update } from '../scripts/update-comparison-data.mjs';
import { comparisonGuides } from '../scripts/review-comparisons.mjs';

const read = (file) => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const snapshot = compileDataset();
const { records } = snapshot;

test('combined downloads match the reviewed article catalogs', () => {
  update('--check');
  assert.equal(snapshot.snapshot.guide_count, 15);
  assert.equal(snapshot.snapshot.program_route_count, 92);
  assert.equal(snapshot.snapshot.country_count, 5);
  assert.equal(snapshot.snapshot.record_count, 480);
  assert.equal(snapshot.snapshot.reviewed_rule_count, 365);
  assert.equal(snapshot.snapshot.unconfirmed_count, 115);
  assert.equal(new Set(records.map(({ record_id }) => record_id)).size, records.length);
  assert.deepEqual(JSON.parse(read('comparison-data/community-comparisons.json')), snapshot);
});

test('downloaded answers retain the exact program and available evidence', () => {
  const pages = new Map(comparisonGuides.map(({ slug }) => [slug, read(slug + '/index.html')]));
  for (const record of records) {
    const link = new URL(record.answer_url);
    assert.ok(link.pathname.endsWith('/' + record.guide + '/'));
    assert.ok(pages.get(record.guide).includes('id="' + link.hash.slice(1) + '"'));
    if (record.fit === 'unknown') {
      assert.equal(record.policy_source, '');
      assert.equal(record.source_checked_on, '');
      assert.equal(record.rule, '');
    } else {
      assert.match(record.policy_source, /^https:\/\//);
      assert.match(record.source_checked_on, /^\d{4}-\d{2}-\d{2}$/);
    }
    assert.match(record.organizer_route, /^https:\/\//);
  }
});

test('the dataset metadata points to the two visible downloads without duplicating the translation', () => {
  const html = read('comparison-data/index.html');
  const meta = JSON.parse(html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1]);
  assert.equal(meta['@type'], 'Dataset');
  assert.equal(meta.url, 'https://itsmeb-lab.github.io/wilke-public-labs/comparison-data/');
  assert.deepEqual(meta.distribution.map(({ encodingFormat }) => encodingFormat), ['text/csv', 'application/json']);
  assert.ok(meta.distribution.every(({ contentUrl }) => html.includes('href="./' + new URL(contentUrl).pathname.split('/').at(-1) + '" download')));
  assert.equal(records.some(({ guide }) => guide === 'milwaukee-articulos-voluminosos'), false);
});
