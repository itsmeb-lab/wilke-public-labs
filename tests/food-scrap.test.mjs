import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { project, update } from '../scripts/update-food-scrap.mjs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const catalog = () => JSON.parse(read('../food-scrap-drop-off/catalog.json'));

test('the food-scrap catalog drives both checked projections', () => {
  update('--check');
  const data = catalog();
  assert.equal(data.operators.length, 6);
  assert.equal(data.rules.length, 28);
  assert.equal(project(data).csv.trimEnd().split('\r\n').length, 31);
});

test('shared words and certifications do not override local bin restrictions', () => {
  const { block } = project(catalog());
  const raw = block.split('<section id="raw-meat"')[1].split('</section>')[0];
  const cooked = block.split('<section id="cooked-meat"')[1].split('</section>')[0];
  assert.match(raw, /data-operator="milwaukee" data-fit="excluded"/);
  assert.match(cooked, /data-operator="milwaukee" data-fit="listed"/);
  const plastic = block.split('<section id="compostable-plastic-bag"')[1].split('</section>')[0];
  assert.match(plastic, /data-operator="minneapolis" data-fit="listed"/);
  assert.match(plastic, /data-operator="carrboro" data-fit="excluded"/);
});

test('the current town location stays distinct from county materials and the market’s note', () => {
  const html = read('../food-scrap-drop-off/index.html');
  assert.match(html, /county page still lists a seasonal farmers’ market/);
  assert.match(html, /href="https:\/\/www\.carrboronc\.gov\/2502\/Compost-Drop-off"/);
  assert.match(html, /href="https:\/\/www\.orangecountync\.gov\/2693\/Food-Waste-Drop-Off-Sites"/);
  assert.doesNotMatch(html, /<script\b|<form\b/);
});
