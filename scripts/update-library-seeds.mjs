import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { project as projectComparison, update as updateComparison } from './organizer-comparison.mjs';

const copy = Object.freeze({
  "prepAnchor": "before-pickup",
  "prepHeading": "Before you pick up seeds",
  "prepLead": "Find the program’s pickup location, then look for its sign-out, registration or donation steps."
});
const target = {
  folder: new URL('../library-seed-borrowing/', import.meta.url),
  marker: 'LIBRARY-SEED-BORROWING',
  copy,
};

export function project(data) {
  return projectComparison(data, copy);
}

export function update(mode) {
  return updateComparison(mode, target);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) update(process.argv[2]);
