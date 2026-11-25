import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { estimateWoodChipLoad } from '../published-policy-lab/wood-chip-load.mjs';
import { catalog } from '../published-policy-lab/data.mjs';

test('the area and depth conversion produces nominal coverage and excess', () => {
  const result = estimateWoodChipLoad(1000, 3);
  assert.equal(result.approximateLoad, 20);
  assert.equal(result.needed.toFixed(2), '9.26');
  assert.equal(result.remainder.toFixed(2), '10.74');
  assert.equal(result.coverageSquareFeet, 2160);
  assert.equal(estimateWoodChipLoad(162, 2).needed, 1);
});

test('a matching nominal load and shortfall preserve the difference direction', () => {
  assert.equal(estimateWoodChipLoad(2160, 3).remainder, 0);
  assert.equal(estimateWoodChipLoad(4320, 3).remainder, -20);
  assert.equal(estimateWoodChipLoad(3240, 2).coverageSquareFeet, 3240);
});

test('missing, malformed and out-of-range inputs fail before calculating', () => {
  const invalid = [[NaN, 3], [0, 3], ['250', 3], [30, 0], [500, 25], [Infinity, 5], [1_000_001, 2], [10, .01]];
  for (const args of invalid) assert.throws(() => estimateWoodChipLoad(...args), RangeError);
});

test('the town estimate remains linked to the reviewed source and the formula works in static HTML', () => {
  const town = catalog.places.find(({ id }) => id === 'wakeforest-woodchips-program');
  assert.match(town.policies.mulch_delivery.summary, /approximately 20-cubic-yard/);
  assert.match(town.policies.mulch_delivery.conditions.join(' '), /will not return/);
  const html = readFileSync(new URL('../published-policy-lab/index.html', import.meta.url), 'utf8');
  assert.match(html, /<section class="wood-chip-load" id="wood-chip-load"/);
  assert.match(html, /divide by 324/);
  assert.match(html, /rough estimate of 180 square feet[^.]+\. The unit conversion used here gives 162 square feet/);
  assert.match(html, /<fieldset id="wood-chip-controls" hidden>/);
  assert.ok(html.includes(catalog.sources.find(({ id }) => id === 'wakeforest-woodchips').url));
});
