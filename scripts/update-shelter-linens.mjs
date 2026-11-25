import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { project as projectComparison, update as updateComparison } from './organizer-comparison.mjs';

const copy = Object.freeze({
  "prepAnchor": "drop-off",
  "prepHeading": "How to drop off a donation",
  "prepLead": "Check the current wish list, drop-off hours and any instructions for bags or bulk quantities. Confirm that your items are clean and in the condition the organization accepts."
});
const target = {
  folder: new URL('../shelter-linen-guide/', import.meta.url),
  marker: 'SHELTER-LINENS',
  copy,
};

export function project(data) {
  return projectComparison(data, copy);
}

export function update(mode) {
  return updateComparison(mode, target);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) update(process.argv[2]);
