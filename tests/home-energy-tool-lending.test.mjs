import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { project, update } from '../scripts/update-home-energy-tool-lending.mjs';
import { comparisonRecords } from '../scripts/organizer-comparison.mjs';
import { buildSearchIndex, searchGuides } from '../guide-finder/search.mjs';
import { guides } from '../guide-finder/index-data.mjs';

const root = new URL('../home-energy-tool-lending/', import.meta.url);
const catalog = JSON.parse(readFileSync(new URL('catalog.json', root), 'utf8'));
const rows = comparisonRecords(catalog);
const byTask = (item, operator) => rows.find(({item_id, operator_id}) => item_id === item && operator_id === operator);

test('each selected energy program has source-bound equipment and hold answers', () => {
  update('--check');
  assert.equal(catalog.operators.length, 8);
  assert.equal(rows.length, 32);
  assert.equal(rows.filter(({policy_source}) => policy_source).length, 25);
  assert.equal(byTask('power-meter', 'ballarat').fit, 'ask');
  assert.match(byTask('power-meter', 'ballarat').rule, /only some/i);
  assert.equal(byTask('power-meter', 'kent').fit, 'unknown');
  assert.equal(byTask('power-meter', 'kent').policy_source, '');
  assert.equal(byTask('spot-meter', 'kent'), undefined);
  assert.equal(byTask('thermal-camera', 'dunedin').fit, 'excluded');
  assert.equal(byTask('infrared-thermometer', 'dunedin').fit, 'listed');
  assert.equal(byTask('thermal-camera', 'norfolk').fit, 'ask');
  const {block} = project(catalog);
  assert.match(block, /iOS 18 or Android 14/);
  assert.match(block, /same place/i);
});

test('the finder resolves a device, preserving what the local kit covers', () => {
  const index = buildSearchIndex(guides);
  const first = (query, region) => searchGuides(index, {query, region})[0];
  const camera = first('borrow thermal imaging camera', 'gb-eng');
  assert.equal(camera?.id, 'thermal-camera');
  assert.ok(camera.routes.some(({id,fit}) => id === 'kent' && fit === 'listed'));
  const meter = first('borrow plug-in electricity meter', 'au-vic');
  assert.equal(meter?.id, 'power-meter');
  assert.ok(meter.routes.some(({id,fit}) => id === 'ballarat' && fit === 'ask'));
});
