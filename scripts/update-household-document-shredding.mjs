import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { project as projectComparison, update as updateComparison } from './organizer-comparison.mjs';

const copy = Object.freeze({
  "prepAnchor": "before-shredding",
  "prepHeading": "Before you bring documents",
  "prepLead": "Check the appointment or event date, allowed volume, permitted fasteners and residency or membership rule."
});
const target = {
  folder: new URL('../household-document-shredding/', import.meta.url),
  marker: 'HOUSEHOLD-DOCUMENT-SHREDDING',
  copy,
};

export function project(data) {
  return projectComparison(data, copy);
}

export function update(mode) {
  return updateComparison(mode, target);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) update(process.argv[2]);
