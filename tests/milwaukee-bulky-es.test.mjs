import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { localize, update } from '../scripts/update-milwaukee-bulky-es.mjs';
import { project } from '../scripts/organizer-comparison.mjs';
import { sourceImpact } from '../scripts/review-comparisons.mjs';

const read = (file) => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const catalog = JSON.parse(read('milwaukee-bulky-items/catalog.json'));
const translation = JSON.parse(read('milwaukee-articulos-voluminosos/translation.json'));
const hosts = 'https://itsmeb-lab.github.io/wilke-public-labs/';
const es = 'milwaukee-articulos-voluminosos/';
const en = 'milwaukee-bulky-items/';

test('Spanish keeps every stable task, route and source outcome', () => {
  update('--check');
  const localized = localize(catalog, translation);
  assert.equal(localized.rules.length, 20);
  assert.deepEqual(localized.rules.map(({ text, ...route }) => route), catalog.rules.map(({ text, ...route }) => route));
  assert.deepEqual(localized.tasks.map(({ id }) => id), catalog.tasks.map(({ id }) => id));
  assert.deepEqual(Object.values(localized.sources).map(({ url }) => url), Object.values(catalog.sources).map(({ url }) => url));
  assert.match(read(es + 'index.html'), /No se acepta/);
  const tvSource = 'https://wauwatosa.gov/departments/public-works/collection-services/drop-off-center/';
  assert.deepEqual(sourceImpact(tvSource).matches.map(({ page }) => page), [hosts + en, hosts + es]);
});

test('translations fail closed when an English rule changes or one translation is deleted', () => {
  const changed = structuredClone(catalog);
  changed.rules[0].text += ' Changed fact.';
  assert.throws(() => localize(changed, translation), /source catalog changed/);
  const missing = structuredClone(translation);
  delete missing.rules['milwaukee-curb:tv'];
  assert.throws(() => localize(catalog, missing), /source rules/);
  assert.throws(() => project(catalog, { locale: 'fr-CA' }), /Unsupported comparison language/);
});

test('the two guides have their own canonical and reciprocal language links', () => {
  for (const path of [en, es]) {
    const html = read(path + 'index.html');
    assert.ok(html.includes('<link rel="canonical" href="' + hosts + path + '">'));
    assert.ok(html.includes('hreflang="en-US" href="' + hosts + en + '"'));
    assert.ok(html.includes('hreflang="es-US" href="' + hosts + es + '"'));
  }
  assert.match(read(es + 'index.html'), /<html lang="es-US">/);
  assert.match(read(es + 'index.html'), /Folleto municipal de basura y reciclaje en español/);
});
