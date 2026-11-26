import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { project as projectComparison, update as updateComparison } from './organizer-comparison.mjs';

const copy = Object.freeze({
  "prepAnchor": "before-digitizing",
  "prepHeading": "Before digitizing",
  "prepLead": "Check the media format, first-visit requirements and your storage device for the chosen station."
});
const target = {
  folder: new URL('../library-memory-labs/', import.meta.url),
  marker: 'LIBRARY-MEMORY-LABS',
  copy,
};

export function project(data) {
  return projectComparison(data, copy);
}

export function update(mode) {
  return updateComparison(mode, target);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) update(process.argv[2]);
