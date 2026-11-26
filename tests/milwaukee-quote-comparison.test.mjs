import test from 'node:test';
import assert from 'node:assert/strict';
import { scenarios } from '../milwaukee-cleanout-floor-handoff/quote-math.mjs';

function quotes() {
  return {
    loads: '1',
    matchingScope: true,
    a: { base: '650', included: '1', overage: '200', fees: '0' },
    b: { base: '790', included: '2', overage: '', fees: '0' },
  };
}

test('a second load can reverse the cheaper quote', () => {
  const { planned, oneMore } = scenarios(quotes());
  assert.deepEqual([planned.a.knownCents, planned.b.knownCents, planned.result], [65000, 79000, 'a']);
  assert.deepEqual([oneMore.a.knownCents, oneMore.b.knownCents, oneMore.result], [85000, 79000, 'b']);
});

test('an unpriced extra load is irrelevant only if all loads are included', () => {
  const input = quotes();
  input.loads = '2';
  const result = scenarios(input);
  assert.equal(result.planned.result, 'b');
  assert.equal(result.oneMore.result, 'incomparable');
  assert.deepEqual(result.oneMore.b.missing, ['extra load price']);
});

test('an unspecified fee is different from a confirmed zero fee', () => {
  const input = quotes();
  input.a.fees = '';
  const { planned } = scenarios(input);
  assert.equal(planned.a.knownCents, 65000);
  assert.deepEqual(planned.a.missing, ['other charges']);
  assert.equal(planned.result, 'incomparable');
});

test('unmatched scope suppresses the cheaper estimate', () => {
  const input = quotes();
  input.matchingScope = false;
  const result = scenarios(input);
  assert.equal(result.planned.result, 'incomparable');
  assert.equal(result.oneMore.result, 'incomparable');
});

test('money rounds neither fees nor the difference between quotes', () => {
  const input = quotes();
  input.a.base = '$1,200.09';
  input.a.fees = '$0.01';
  input.b.base = '$1,200.10';
  const result = scenarios(input);
  assert.equal(result.planned.a.knownCents, 120010);
  assert.equal(result.planned.result, 'equal');
});

test('invalid amounts and noninteger job loads fail explicitly', () => {
  for (const amount of ['12,34', '-5', '5.123', '1e3', '1000001']) {
    const input = quotes();
    input.a.base = amount;
    assert.throws(() => scenarios(input), /amount/);
  }
  for (const loads of ['0', '-1', '1.5', '31', '']) {
    const input = quotes();
    input.loads = loads;
    assert.throws(() => scenarios(input), /loads/);
  }
});

test('thirty loads is accepted without projecting beyond the input limit', () => {
  const input = quotes();
  input.loads = '30';
  const result = scenarios(input);
  assert.equal(result.planned.a.excess, 29);
  assert.equal(result.oneMore, null);
});
