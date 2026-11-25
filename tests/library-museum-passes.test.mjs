import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { project, update } from '../scripts/update-library-museum-passes.mjs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const catalog = JSON.parse(read('../library-museum-passes/catalog.json'));

function comparison(block, task) {
  return block.split('<section id="' + task + '"')[1].split('</section>')[0];
}

test('museum pass comparison and CSV match the dated official evidence', () => {
  update('--check');
  assert.equal(catalog.operators.length, 5);
  assert.equal(catalog.tasks.length, 5);
  assert.equal(catalog.rules.length, 22);
  assert.equal(project(catalog).csv.trimEnd().split('\r\n').length, 26);
});

test('a pass booking does not imply online venue redemption or rule out other entry routes', () => {
  const { block } = project(catalog);
  const reserve = comparison(block, 'reserve-pass');
  const book = comparison(block, 'book-venue');
  const door = comparison(block, 'at-the-door');
  assert.match(reserve, /data-operator="shorewood-betty-brinn" data-fit="excluded"/);
  assert.match(book, /data-operator="boston-aquarium" data-fit="listed"/);
  assert.match(book, /data-operator="shorewood-betty-brinn" data-fit="excluded"/);
  assert.match(book, /data-operator="burlington-partners" data-fit="ask"/);
  assert.match(book, /data-operator="berkshire-mass-moca" data-fit="unknown"/);
  assert.match(door, /data-operator="shorewood-betty-brinn" data-fit="listed"/);
  assert.match(door, /data-operator="berkshire-mass-moca" data-fit="listed"/);
});

test('a physical return rule stays scoped to the loan route and its pass format', () => {
  const html = read('../library-museum-passes/index.html');
  const returns = comparison(html, 'return-pass');
  assert.match(returns, /data-operator="shorewood-betty-brinn" data-fit="listed"/);
  assert.match(returns, /data-operator="burlington-partners" data-fit="ask"/);
  assert.match(returns, /data-operator="toronto-aga-khan" data-fit="excluded"/);
  assert.doesNotMatch(html, /<form\b|<script\b|noindex/);
});
