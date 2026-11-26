import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { project as projectComparison, update as updateComparison } from './organizer-comparison.mjs';

const copy = Object.freeze({
  "prepAnchor": "before-the-park",
  "prepHeading": "Before you go to the park",
  "prepLead": "Match a library pickup, eligible vehicle and exact park to the pass you want to use."
});
const target = {
  folder: new URL('../library-state-park-passes/', import.meta.url),
  marker: 'LIBRARY-STATE-PARK-PASSES',
  copy,
};

export function project(data) {
  return projectComparison(data, copy);
}

export function update(mode) {
  return updateComparison(mode, target);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) update(process.argv[2]);
