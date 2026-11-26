import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { project as projectComparison, update as updateComparison } from './organizer-comparison.mjs';

const copy = Object.freeze({
  "prepAnchor": "before-dropoff",
  "prepHeading": "Before you drop off",
  "prepLead": "Check the shop’s hours and describe the bicycle’s condition before moving an uncertain donation."
});
const target = {
  folder: new URL('../used-bicycle-donations/', import.meta.url),
  marker: 'USED-BICYCLE-DONATIONS',
  copy,
};

export function project(data) {
  return projectComparison(data, copy);
}

export function update(mode) {
  return updateComparison(mode, target);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) update(process.argv[2]);
