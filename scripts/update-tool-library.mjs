import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { project as projectComparison, update as updateComparison } from './organizer-comparison.mjs';

const copy = Object.freeze({
  "prepAnchor": "before-checkout",
  "prepHeading": "Before you borrow",
  "prepLead": "Find the item, confirm your eligibility and compare the full checkout and return terms."
});
const target = {
  folder: new URL('../tool-library-borrowing/', import.meta.url),
  marker: 'TOOL-LIBRARY-BORROWING',
  copy,
};

export function project(data) {
  return projectComparison(data, copy);
}

export function update(mode) {
  return updateComparison(mode, target);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) update(process.argv[2]);
