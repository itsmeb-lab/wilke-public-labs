import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { project, update } from '../scripts/update-hardwood-finish-return.mjs';

const read = (path) => readFileSync(new URL('../hardwood-finish-return/' + path, import.meta.url), 'utf8');
const catalog = JSON.parse(read('catalog.json'));

test('each of the six exact products has five sourced activities in the synchronized page and export', () => {
  update('--check');
  const { block, csv } = project(catalog);
  assert.equal(catalog.products.length, 6);
  assert.equal(catalog.activities.length, 5);
  assert.equal(csv.trim().split('\n').length, 31);
  for (const product of catalog.products) {
    assert.ok(block.includes('href="#' + product.id + '"'));
    for (const activity of catalog.activities) {
      const entry = product.guidance[activity.id];
      const row = block.split('id="' + product.id + '-' + activity.id + '"')[1].split('</div>')[0];
      assert.ok(row.includes(product.sources[entry.source ?? 0].url));
    }
  }
});

test('the guide exposes inconsistent walking times and distinguishes rug return from full cure', () => {
  const { block } = project(catalog);
  const conflict = block.split('id="pallmann-pall-x-gold-walking"')[1].split('</div>')[0];
  assert.match(conflict, /data-status="conflict"/);
  assert.match(conflict, /3–4 hours.*24 hours.*Get a written walking time/);
  const streetShoe = catalog.products.find((product) => product.id === 'streetshoe-nxt');
  assert.match(streetShoe.guidance.rugs.text, /at least 2 weeks/);
  assert.match(streetShoe.guidance.cure.text, /about 7 days/);
  const rubio = catalog.products.find((product) => product.id === 'rubio-oil-plus-2c');
  assert.equal(rubio.guidance.rugs.status, 'confirm');
  assert.match(rubio.guidance.cure.text, /21 days when Part A was used alone/);
});

test('an invalid source, missing activity or duplicated product fails the projection', () => {
  const unsafe = structuredClone(catalog);
  unsafe.products[0].sources[0].url = 'http://example.invalid';
  assert.throws(() => project(unsafe), /HTTPS manufacturer source/);
  const missing = structuredClone(catalog);
  delete missing.products[0].guidance.rugs;
  assert.throws(() => project(missing), /Incomplete product data/);
  assert.throws(() => project({ ...catalog, products: [...catalog.products, catalog.products[0]] }), /distinct ID/);
});

test('the printable room card has no interactive contact or identity controls', () => {
  const page = read('index.html');
  assert.match(page, /id="care-record"/);
  assert.match(page, /<dt>Last coat date, time and time zone<\/dt>/);
  assert.match(page, /<dt>First routine cleaning and cleaner<\/dt>/);
  assert.match(page, /href="\.\/finish-guidance\.csv" download/);
  assert.doesNotMatch(page, /<form\b|<input\b|<script\b|<textarea\b/i);
  assert.match(read('finish.css'), /@media print/);
});
