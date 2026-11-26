import { readMoney } from '../milwaukee-cleanout-floor-handoff/quote-math.mjs';

const requiredAmount = (value, description) => {
  const amount = readMoney(value, description);
  if (amount === null) throw new Error('Enter the amount for ' + description + '. Use zero if the paperwork confirms zero.');
  return amount;
};

export function estimateChange(values) {
  const original = requiredAmount(values.original, 'the original estimate');
  const approvedCharges = requiredAmount(values.approvedCharges, 'earlier approved charges');
  const approvedCredits = requiredAmount(values.approvedCredits, 'earlier approved credits');
  const current = original + approvedCharges - approvedCredits;
  if (current < 0) throw new Error('Earlier credits exceed the original estimate plus approved charges. Check which amounts the estimate includes.');

  let pending;
  let lineDifference = null;
  if (values.kind === 'charge') {
    pending = requiredAmount(values.amount, 'the proposed charge');
  } else if (values.kind === 'credit') {
    pending = -requiredAmount(values.amount, 'the proposed credit');
  } else if (values.kind === 'replacement') {
    const newCharge = requiredAmount(values.amount, 'the replacement charge');
    const credit = readMoney(values.credit, 'the written replacement credit');
    if (credit === null) throw new Error('Ask how much credit the replacement gives for the original line. Enter zero if the contractor confirms there is no credit.');
    const originalLine = readMoney(values.originalLine, 'the original line');
    if (originalLine !== null) lineDifference = originalLine - credit;
    pending = newCharge - credit;
  } else {
    throw new Error('Choose how the proposed change was written.');
  }

  if (!['inclusive', 'before'].includes(values.basis)) {
    throw new Error('Confirm that all amounts use the same tax and fee basis before adding them.');
  }
  const revised = current + pending;
  if (revised < 0) throw new Error('The proposed credit is larger than the current estimate. Ask for a written revised balance.');

  return { original, current, earlier: approvedCharges - approvedCredits, pending, revised, lineDifference, basis: values.basis };
}
