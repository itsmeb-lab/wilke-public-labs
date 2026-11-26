import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { update as checkSensory } from '../scripts/update-library-sensory-spaces.mjs';
import { update as checkDonations } from '../scripts/update-eyeglass-donations.mjs';
import { sourceImpact } from '../scripts/review-comparisons.mjs';

const read = (file) => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const getCatalog = (slug) => JSON.parse(read(slug + '/catalog.json'));
const ruleFor = (data, operator, task) => data.rules.find((rule) => rule.operator === operator && rule.task === task);

test('two Durham rooms retain different booking and card rules', () => {
  checkSensory('--check');
  const data = getCatalog('library-sensory-spaces');
  assert.equal(ruleFor(data, 'durham-calming', 'walk-in').fit, 'listed');
  assert.equal(ruleFor(data, 'durham-mse', 'walk-in').fit, 'excluded');
  assert.equal(ruleFor(data, 'durham-calming', 'no-library-card').fit, 'listed');
  assert.equal(ruleFor(data, 'durham-mse', 'no-library-card').fit, 'excluded');
  const impact = sourceImpact('https://durhamcountylibrary.org/policies/sensory-room-policy/').matches[0];
  assert.deepEqual(impact.routeLinks.map(({ operator }) => operator), ['durham-calming', 'durham-mse']);
});

test('eyeglass donor routes separate loose lenses, material and a source conflict', () => {
  checkDonations('--check');
  const data = getCatalog('eyeglass-donation-rules');
  assert.equal(ruleFor(data, 'georgia-lions', 'loose-lenses').fit, 'ask');
  assert.equal(ruleFor(data, 'minnesota-lions', 'loose-lenses').fit, 'excluded');
  assert.match(ruleFor(data, 'minnesota-lions', 'broken-frames').text, /metal.*plastic/);
  assert.equal(ruleFor(data, 'canadian-lions', 'loose-lenses'), undefined);
  const policy = 'https://lionslighthouse.org/wp-content/uploads/2025/Recycling_Center_Collection_Policies_202508.pdf';
  assert.equal(sourceImpact(policy).matches[0].staticCitations, 1);
});
