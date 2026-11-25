import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { project, update } from '../scripts/update-shelter-linens.mjs';

const read = (relative) => readFileSync(new URL(relative, import.meta.url), 'utf8');
const catalog = () => JSON.parse(read('../shelter-linen-guide/catalog.json'));
const canonical = 'https://itsmeb-lab.github.io/wilke-public-labs/shelter-linen-guide/';

test('shelter comparison reproduces the published HTML and CSV from one reviewed catalog', () => {
  update('--check');
  const data = catalog();
  assert.equal(data.operators.length, 7);
  assert.equal(data.tasks.length, 6);
  assert.equal(data.rules.length, 33);
  assert.equal(project(data).csv.trimEnd().split('\r\n').length, 43);
});

test('linen rules distinguish a current need, a standing exclusion and a size question', () => {
  const { block } = project(catalog());
  const towels = block.split('<section id="bath-towels"')[1].split('</section>')[0];
  assert.match(towels, /data-operator="charlotte" data-fit="paused"[\s\S]+?No current need/);
  assert.match(towels, /data-operator="haywood-county" data-fit="ask"/);
  assert.match(towels, /data-operator="casa-grande" data-fit="listed"/);
  const fitted = block.split('<section id="fitted-sheets"')[1].split('</section>')[0];
  assert.match(fitted, /data-operator="charlotte" data-fit="excluded"/);
  assert.match(fitted, /data-operator="christchurch" data-fit="ask"/);
  assert.match(fitted, /data-operator="voorhees" data-fit="unknown"/);
});

test('Christchurch animal care links keep national policy and centre directions distinct', () => {
  const { block, csv } = project(catalog());
  const line = csv.split('\r\n').find((row) => row.startsWith('"christchurch:comforters"'));
  assert.match(line, /"excluded","[^"]+","https:\/\/www\.spca\.nz\/donate\/donate-goods","2026-11-25","https:\/\/www\.spca\.nz\/centre\/christchurch-centre\/donations-fundraising"/);
  assert.match(block, /<section id="drop-off"[\s\S]+?animal care to the centre during opening hours/);
});

test('the guide stands alone without JavaScript and links to the maintained comparison', () => {
  const html = read('../shelter-linen-guide/index.html');
  assert.deepEqual([...html.matchAll(/rel="canonical" href="([^"]+)"/g)].map((match) => match[1]), [canonical]);
  assert.ok(html.includes('<meta property="og:url" content="' + canonical + '">'));
  assert.ok(html.includes('href="./comparison.csv" download'));
  assert.doesNotMatch(html, /<script\b|<form\b|noindex|data-diagnostic-link/);
  assert.ok(read('../index.html').includes('href="./shelter-linen-guide/"'));
  assert.ok(read('../published-policy-lab/index.html').includes('href="../shelter-linen-guide/"'));
  assert.ok(read('../sitemap.xml').includes('<loc>' + canonical + '</loc>'));
  for (const [, target] of html.matchAll(/href="#([a-z0-9-]+)"/g)) {
    assert.equal([...html.matchAll(new RegExp('\\bid="' + target + '"', 'g'))].length, 1);
  }
});
