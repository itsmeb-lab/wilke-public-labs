import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { project as projectComparison, update as updateComparison } from './organizer-comparison.mjs';

const copy = Object.freeze({
  "prepAnchor": "plan-your-visit",
  "prepHeading": "Plan your visit in order",
  "prepLead": "Follow the named library and venue instructions. Confirm the date, group limit and pass format before traveling."
});
const target = {
  folder: new URL('../library-museum-passes/', import.meta.url),
  marker: 'LIBRARY-MUSEUM-PASSES',
  copy,
};

export function project(data) {
  return projectComparison(data, copy);
}

export function update(mode) {
  return updateComparison(mode, target);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) update(process.argv[2]);
