import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { project as projectComparison, update as updateComparison } from './organizer-comparison.mjs';

const copy = Object.freeze({
  "prepAnchor": "before-borrowing",
  "prepHeading": "Before you borrow",
  "prepLead": "Check the membership card, instrument availability and return desk for the exact lending route."
});
const target = {
  folder: new URL('../library-instrument-borrowing/', import.meta.url),
  marker: 'LIBRARY-INSTRUMENT-BORROWING',
  copy,
};

export function project(data) {
  return projectComparison(data, copy);
}

export function update(mode) {
  return updateComparison(mode, target);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) update(process.argv[2]);
