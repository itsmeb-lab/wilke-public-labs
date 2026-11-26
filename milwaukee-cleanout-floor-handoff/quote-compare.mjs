import { scenarios } from './quote-math.mjs';

const box = document.getElementById('quote-controls');
const result = document.getElementById('quote-result');
const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const get = (id) => document.getElementById(id);
const fields = ['base', 'included', 'overage', 'fees'];
const read = (id) => get(id).value;
const quote = (id) => Object.fromEntries(fields.map((key) => [key, read(id + '-' + key)]));

function add(tag, text, parent) {
  const el = document.createElement(tag);
  el.textContent = text;
  parent.append(el);
}

function totals(label, item) {
  const money = amount.format(item.knownCents / 100);
  if (!item.missing.length) return label + ' ' + money;
  return label + ' known subtotal ' + money + '. Check ' + item.missing.join(' and ') + '.';
}

function drawScenario(row) {
  const block = document.createElement('li');
  add('h3', row.loads === 1 ? '1 load' : row.loads + ' loads', block);
  add('p', totals('Estimate A', row.a), block);
  add('p', totals('Estimate B', row.b), block);
  if (row.result === 'equal') add('p', 'The two totals match at this load count.', block);
  if (row.result === 'a' || row.result === 'b') {
    const difference = amount.format(Math.abs(row.a.knownCents - row.b.knownCents) / 100);
    add('p', 'Estimate ' + row.result.toUpperCase() + ' is ' + difference + ' lower at this load count.', block);
  }
  if (row.result === 'incomparable') add('p', 'Confirm the included work and any unpriced charges before choosing between estimates.', block);
  return block;
}

function render() {
  result.replaceChildren();
  try {
    const { planned, oneMore } = scenarios({
      loads: read('quote-loads'), matchingScope: get('quote-match').checked, a: quote('quote-a'), b: quote('quote-b'),
    });
    const cards = document.createElement('ul');
    cards.className = 'cards';
    cards.append(drawScenario(planned));
    if (oneMore) cards.append(drawScenario(oneMore));
    result.append(cards);
  } catch (error) {
    add('p', error.message, result);
  }
}

get('quote-run').addEventListener('click', render);
get('quote-sample').addEventListener('click', () => {
  for (const [id, value] of Object.entries({
    'quote-loads': '1', 'quote-a-base': '650', 'quote-a-included': '1', 'quote-a-overage': '200', 'quote-a-fees': '0',
    'quote-b-base': '790', 'quote-b-included': '2', 'quote-b-overage': '', 'quote-b-fees': '0',
  })) get(id).value = value;
  get('quote-match').checked = true;
  render();
});
box.addEventListener('input', () => result.replaceChildren());
box.hidden = false;
