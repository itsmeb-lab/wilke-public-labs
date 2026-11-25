import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { buildExchange, guideRow } from '../scripts/export-wordpress-comparison.mjs';

test('WordPress draft exchange matches the checked-in generated file', () => {
  const actual = readFileSync(new URL('../wordpress-exchange/comparisons-draft.csv', import.meta.url), 'utf8');
  assert.equal(actual.replaceAll('\r\n', '\n'), buildExchange().replaceAll('\r\n', '\n'));
});

test('a staged draft makes project-relative links absolute and keeps local fragments', () => {
  const [slug, heading, description, canonical, checkedOn, state, body] = guideRow('shelter-linen-guide');
  assert.equal(slug, 'shelter-linen-guide');
  assert.match(heading, /Can I donate towels/);
  assert.match(description, /donation rules/);
  assert.ok(canonical.endsWith('/shelter-linen-guide/'));
  assert.equal(checkedOn, '2026-11-25');
  assert.equal(state, 'STAGING_DRAFT_ONLY');
  assert.match(body, /href="#fitted-sheets"/);
  assert.ok(body.includes('href="' + canonical + 'comparison.csv"'));
  assert.doesNotMatch(body, /<h1[\s>]|<script\b|<form\b|href="\.\.?\//);
  assert.throws(() => guideRow('../published-policy-lab'), /Unknown comparison guide/);
});
