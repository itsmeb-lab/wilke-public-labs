import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { project, update } from '../scripts/update-milwaukee-bulky.mjs';

const read = (relative) => readFileSync(new URL(relative, import.meta.url), 'utf8');
const catalog = () => JSON.parse(read('../milwaukee-bulky-items/catalog.json'));
const canonical = 'https://itsmeb-lab.github.io/wilke-public-labs/milwaukee-bulky-items/';

test('the municipal route catalog matches static HTML and CSV', () => {
  update('--check');
  const data = catalog();
  assert.equal(data.operators.length, 4);
  assert.equal(data.rules.length, 20);
  assert.equal(project(data).csv.trimEnd().split('\r\n').length, 21);
});

test('municipal routes do not inherit another service’s item or access rules', () => {
  const { block } = project(catalog());
  const tv = block.split('<section id="tv"')[1].split('</section>')[0];
  assert.match(tv, /data-operator="milwaukee-curb" data-fit="excluded"/);
  assert.match(tv, /data-operator="milwaukee-drop-off" data-fit="listed"/);
  assert.match(tv, /data-operator="wauwatosa-curb" data-fit="listed"/);
  const hauler = block.split('<section id="commercial-hauler"')[1].split('</section>')[0];
  assert.match(hauler, /data-operator="milwaukee-drop-off" data-fit="ask"/);
  assert.match(hauler, /data-operator="wauwatosa-drop-off" data-fit="excluded"/);
  const mixed = block.split('<section id="mixed-cleanout"')[1].split('</section>')[0];
  assert.match(mixed, /data-operator="milwaukee-curb" data-fit="excluded"/);
});

test('the Wauwatosa TV price difference is visible with both primary sources', () => {
  const html = read('../milwaukee-bulky-items/index.html');
  assert.match(html, /\$30–\$45 each/);
  const note = html.split('<h2 id="notes-title">')[1].split('</section>')[0];
  assert.match(note, /give different drop-off price descriptions/);
  assert.match(note, /collection-services\/special-collection\//);
  assert.match(note, /collection-services\/drop-off-center\//);
});

test('the canonical guide has ordinary links and no intake or booking surface', () => {
  const html = read('../milwaukee-bulky-items/index.html');
  assert.deepEqual([...html.matchAll(/rel="canonical" href="([^"]+)"/g)].map((match) => match[1]), [canonical]);
  assert.doesNotMatch(html, /<script\b|<form\b|noindex|data-diagnostic-link/);
  assert.ok(read('../index.html').includes('href="./milwaukee-bulky-items/"'));
  assert.ok(read('../published-policy-lab/index.html').includes('href="../milwaukee-bulky-items/"'));
  assert.ok(read('../sitemap.xml').includes('<loc>' + canonical + '</loc>'));
});

test('furniture donation distinguishes stairs, standard pickup and partner routing', () => {
  const html = read('../milwaukee-bulky-items/index.html');
  const note = html.split('<section class="notes" id="donation-pickup"')[1].split('</section>')[0];
  assert.match(note, /first-floor location, a garage or a building with elevator access/);
  assert.match(note, /ReSupply’s paid route handles stairs/);
  assert.match(note, /Goodwill Greater Milwaukee &amp; Chicago does not take furniture directly/);
  assert.match(note, /milwaukeerestore\.org\/donate\/schedule-a-pickup/);
  assert.match(note, /goodwillgreatermc\.org\/donate\/donate-items/);
  assert.ok(html.includes('href="#donation-pickup"'));
});
