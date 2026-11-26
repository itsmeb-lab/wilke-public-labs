const maxCents = 100000000;
const maxLoads = 30;

function readMoney(value, label) {
  const text = value.trim();
  if (!text) return null;
  if (!/^\$?(?:[0-9]+|[0-9]{1,3}(?:,[0-9]{3})+)(?:\.[0-9]{1,2})?$/.test(text)) {
    throw new Error('Enter a valid dollar amount for ' + label + '.');
  }
  const [whole, cents = ''] = text.replace(/[$,]/g, '').split('.');
  const total = Number(whole) * 100 + Number(cents.padEnd(2, '0'));
  if (!Number.isSafeInteger(total) || total > maxCents) throw new Error('Enter an amount up to $1,000,000 for ' + label + '.');
  return total;
}

function readLoads(value, label, minimum) {
  if (!/^\d{1,2}$/.test(value.trim())) throw new Error('Enter a whole number of loads for ' + label + '.');
  const count = Number(value);
  if (count < minimum || count > maxLoads) throw new Error('Use ' + minimum + ' to ' + maxLoads + ' loads for ' + label + '.');
  return count;
}

function readQuote(values, label) {
  const base = readMoney(values.base, label + ' base price');
  if (base === null) throw new Error('Enter the base price for ' + label + '.');
  return {
    base,
    included: readLoads(values.included, label + ' included loads', 0),
    overage: readMoney(values.overage, label + ' extra load price'),
    fees: readMoney(values.fees, label + ' other charges'),
  };
}

function estimate(quote, loads) {
  const excess = Math.max(0, loads - quote.included);
  const missing = [];
  if (quote.fees === null) missing.push('other charges');
  if (excess > 0 && quote.overage === null) missing.push('extra load price');
  return {
    excess,
    knownCents: quote.base + (quote.fees ?? 0) + excess * (quote.overage ?? 0),
    missing,
  };
}

function compareAt(quotes, loads, matchingScope) {
  const [a, b] = quotes.map((quote) => estimate(quote, loads));
  let result = 'incomparable';
  if (matchingScope && !a.missing.length && !b.missing.length) {
    result = a.knownCents === b.knownCents ? 'equal' : a.knownCents < b.knownCents ? 'a' : 'b';
  }
  return { loads, a, b, result };
}

export function scenarios({ loads, matchingScope, a, b }) {
  const count = readLoads(loads, 'the job', 1);
  const quotes = [readQuote(a, 'Estimate A'), readQuote(b, 'Estimate B')];
  return {
    planned: compareAt(quotes, count, matchingScope === true),
    oneMore: count < maxLoads ? compareAt(quotes, count + 1, matchingScope === true) : null,
  };
}
