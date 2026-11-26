import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { estimateChange } from '../estimate-change-calculator/change-math.mjs';

const input = {
  original: '$1,800.00', approvedCharges: '75', approvedCredits: '0',
  kind: 'charge', amount: '160', credit: '', originalLine: '', basis: 'inclusive',
};
const evaluate = (patch = {}) => estimateChange({ ...input, ...patch });
const html = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('earlier approved changes and the pending proposal stay separate', () => {
  const result = evaluate({ approvedCredits: '20.25' });
  assert.deepEqual(result, { original: 180000, current: 185475, earlier: 5475, pending: 16000,
    revised: 201475, lineDifference: null, basis: 'inclusive' });
});

test('a confirmed net credit is entered once and unused replacement fields have no effect', () => {
  const result = evaluate({ kind: 'credit', amount: '44.02', credit: 'invalid', originalLine: '900' });
  assert.equal(result.pending, -4402);
  assert.equal(result.revised, 183098);
  assert.equal(result.lineDifference, null);
});

test('the original line is a reference and only a written replacement credit reduces the new charge', () => {
  const result = evaluate({ kind: 'replacement', amount: '720.25', credit: '400.25', originalLine: '500' });
  assert.equal(result.pending, 32000);
  assert.equal(result.revised, 219500);
  assert.equal(result.lineDifference, 9975);
  assert.equal(evaluate({ kind: 'replacement', amount: '300', credit: '400' }).pending, -10000);
});

test('a missing replacement credit and an explicit zero are different', () => {
  const proposal = { kind: 'replacement', amount: '700', originalLine: '500' };
  assert.throws(() => evaluate(proposal), /how much credit/i);
  const result = evaluate({ ...proposal, credit: '0' });
  assert.equal(result.pending, 70000);
  assert.equal(result.lineDifference, 50000);
});

test('unknown tax basis and blank earlier amounts suppress the projection', () => {
  for (const basis of ['', 'mixed', 'unknown']) assert.throws(() => evaluate({ basis }), /same tax and fee basis/);
  assert.throws(() => evaluate({ approvedCredits: '' }), /earlier approved credits/);
  assert.equal(evaluate({ basis: 'before' }).basis, 'before');
});

test('impossible balances and malformed money produce a useful error', () => {
  assert.throws(() => evaluate({ approvedCredits: '2000' }), /Earlier credits exceed/);
  assert.throws(() => evaluate({ kind: 'credit', amount: '1875.01' }), /larger than the current estimate/);
  for (const amount of ['-1', '1e3', '2.999', '1,00', '1000001']) assert.throws(() => evaluate({ amount }));
  assert.throws(() => evaluate({ kind: 'other' }), /choose how/i);
});

test('the standalone worksheet has a static example and keeps entries in the browser', () => {
  const page = html('estimate-change-calculator/index.html');
  const script = html('estimate-change-calculator/change-calculator.mjs');
  assert.match(page, /id="change-tool"[^>]*\bhidden/);
  assert.match(page, /\$2,035/);
  assert.match(page, /<link rel="canonical" href="https:\/\/itsmeb-lab\.github\.io\/wilke-public-labs\/estimate-change-calculator\/">/);
  assert.doesNotMatch(page, /<form\b|type="file"|name="robots"|<script[^>]+https:/i);
  assert.doesNotMatch(script, /fetch\(|sendBeacon|XMLHttpRequest|localStorage|sessionStorage|innerHTML|location\.search/);
  assert.match(script, /estimateChange\(/);
});
