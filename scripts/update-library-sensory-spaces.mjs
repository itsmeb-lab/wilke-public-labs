import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { project as projectComparison, update as updateComparison } from './organizer-comparison.mjs';

const copy = Object.freeze({
  "prepAnchor": "before-visiting",
  "prepHeading": "Before you visit",
  "prepLead": "Use the operator’s link to check the room name, branch, opening time and availability."
});
const target = {
  folder: new URL('../library-sensory-spaces/', import.meta.url),
  marker: 'LIBRARY-SENSORY-SPACES',
  copy,
};

export function project(data) {
  return projectComparison(data, copy);
}

export function update(mode) {
  return updateComparison(mode, target);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) update(process.argv[2]);
