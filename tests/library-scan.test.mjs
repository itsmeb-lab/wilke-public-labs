import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { project, update } from '../scripts/update-library-scan.mjs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const catalog = JSON.parse(read('../library-scanning/catalog.json'));

test('the scanning catalog and generated pages agree', () => {
  update('--check');
  assert.equal(catalog.operators.length, 7);
  assert.equal(catalog.rules.length, 21);
  assert.equal(project(catalog).csv.trimEnd().split('\r\n').length, 36);
});

test('direct email, guest access and supported paper size have separate evidence', () => {
  const { block } = project(catalog);
  const email = block.split('<section id="email"')[1].split('</section>')[0];
  const card = block.split('<section id="no-card"')[1].split('</section>')[0];
  const tabloid = block.split('<section id="tabloid"')[1].split('</section>')[0];
  assert.match(email, /data-operator="brunswick" data-fit="excluded"/);
  assert.match(email, /data-operator="chapel-hill" data-fit="listed"/);
  assert.match(card, /data-operator="chapel-hill" data-fit="ask"/);
  assert.match(card, /data-operator="southern-pines" data-fit="listed"/);
  assert.match(tabloid, /data-operator="durham" data-fit="excluded"/);
  assert.match(tabloid, /data-operator="addison" data-fit="listed"/);
});

test('the guide links to operator instructions without accepting documents', () => {
  const html = read('../library-scanning/index.html');
  assert.match(html, /href="https:\/\/mpl\.org\/library\/print\.php"/);
  assert.doesNotMatch(html, /<form\b|<script\b|type="file"/);
  assert.ok(html.includes('<link rel="canonical" href="https://itsmeb-lab.github.io/wilke-public-labs/library-scanning/">'));
});
