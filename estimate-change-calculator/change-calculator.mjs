import { estimateChange } from './change-math.mjs';

const byId = (id) => document.getElementById(id);
const fieldNames = ['original', 'approvedCharges', 'approvedCredits', 'kind', 'amount', 'credit', 'originalLine', 'basis'];
const fields = Object.fromEntries(fieldNames.map((id) => [id, byId(id)]));
const result = byId('change-result');
const breakdown = byId('change-breakdown');
const creditNote = byId('credit-note');
const dollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const format = (cents) => dollars.format(cents / 100);
const delta = (cents) => cents < 0 ? '−' + format(-cents) : cents > 0 ? '+' + format(cents) : format(0);

function syncKind() {
  byId('replacement-fields').hidden = fields.kind.value !== 'replacement';
  const labels = { charge: 'Proposed charge', credit: 'Proposed credit', replacement: 'New replacement charge' };
  byId('amount-label').textContent = labels[fields.kind.value] ?? 'Proposed amount';
}

function showResult() {
  breakdown.hidden = true;
  creditNote.hidden = true;
  result.hidden = false;
  try {
    const calculated = estimateChange(Object.fromEntries(fieldNames.map((id) => [id, fields[id].value])));
    byId('change-message').textContent = calculated.basis === 'before'
      ? 'These amounts are before taxes and fees.'
      : 'These amounts include applicable taxes and fees.';
    byId('old-total').textContent = format(calculated.original);
    byId('earlier-total').textContent = delta(calculated.earlier);
    byId('current-total').textContent = format(calculated.current);
    byId('pending-total').textContent = delta(calculated.pending);
    byId('new-total').textContent = format(calculated.revised);
    breakdown.hidden = false;
    if (calculated.lineDifference !== null && calculated.lineDifference !== 0) {
      creditNote.textContent = calculated.lineDifference > 0
        ? 'The written credit is ' + format(calculated.lineDifference) + ' below the original line. Ask what portion of that line still applies.'
        : 'The written credit is ' + format(-calculated.lineDifference) + ' above the original line. Ask what else is included in the credit.';
      creditNote.hidden = false;
    }
  } catch (error) {
    byId('change-message').textContent = error.message;
  }
  result.focus();
}

for (const field of Object.values(fields)) {
  field.addEventListener(field.tagName === 'SELECT' ? 'change' : 'input', () => {
    result.hidden = true;
    if (field === fields.kind) syncKind();
  });
}
byId('calculate-change').addEventListener('click', showResult);
byId('example-change').addEventListener('click', () => {
  const example = { original: '1800', approvedCharges: '75', approvedCredits: '0',
    kind: 'replacement', amount: '700', credit: '400', originalLine: '500', basis: 'inclusive' };
  for (const key of fieldNames) fields[key].value = example[key];
  syncKind();
  showResult();
});
byId('clear-change').addEventListener('click', () => {
  for (const field of Object.values(fields)) field.value = '';
  result.hidden = true;
  syncKind();
  fields.original.focus();
});
byId('change-tool').hidden = false;
