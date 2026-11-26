import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { update as checkSeeds } from '../scripts/update-library-seeds.mjs';
import { update as checkTools } from '../scripts/update-tool-library.mjs';
import { sourceImpact } from '../scripts/review-comparisons.mjs';

const read = (file) => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const getCatalog = (slug) => JSON.parse(read(slug + '/catalog.json'));
const ruleFor = (data, operator, task) => data.rules.find((rule) => rule.operator === operator && rule.task === task);

test('library access and the two different seed return decisions preserve their evidence', () => {
  checkSeeds('--check');
  const catalog = getCatalog('library-seed-borrowing');
  assert.equal(ruleFor(catalog, 'canton', 'without-card').fit, 'excluded');
  assert.equal(ruleFor(catalog, 'waterloo', 'without-card').fit, 'listed');
  assert.equal(ruleFor(catalog, 'waikato', 'without-card'), undefined);
  assert.equal(ruleFor(catalog, 'cleveland', 'unused-seeds').fit, 'listed');
  assert.equal(ruleFor(catalog, 'cleveland', 'saved-seeds'), undefined);
  assert.match(ruleFor(catalog, 'mcgill', 'saved-seeds').text, /optional/);
});

test('tool membership and loan fees remain separate for households and member agencies', () => {
  checkTools('--check');
  const catalog = getCatalog('tool-library-borrowing');
  assert.equal(ruleFor(catalog, 'duluth-one-roof', 'household-borrower').fit, 'listed');
  assert.equal(ruleFor(catalog, 'charlotte-toolbank', 'household-borrower').fit, 'excluded');
  assert.equal(ruleFor(catalog, 'charlotte-toolbank', 'free-loan').fit, 'excluded');
  assert.match(ruleFor(catalog, 'charlotte-toolbank', 'extra-fees').text, /5%/);
  assert.equal(ruleFor(catalog, 'milwaukee-hri', 'household-borrower').fit, 'ask');
  const charged = sourceImpact('https://charlotte.toolbank.org/tool-lending-program/tools-fees/').matches[0];
  assert.deepEqual(charged.citedRules.map((item) => item.task), ['free-loan', 'extra-fees', 'return-tool']);
});
