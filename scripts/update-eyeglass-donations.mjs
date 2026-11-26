import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { project as projectComparison, update as updateComparison } from './organizer-comparison.mjs';

const copy = Object.freeze({
  "prepAnchor": "before-donating",
  "prepHeading": "Before dropping off or mailing",
  "prepLead": "Find the program’s own collection route and follow its sorting or shipping instructions."
});
const target = {
  folder: new URL('../eyeglass-donation-rules/', import.meta.url),
  marker: 'EYEGLASS-DONATION-RULES',
  copy,
};

export function project(data) {
  return projectComparison(data, copy);
}

export function update(mode) {
  return updateComparison(mode, target);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) update(process.argv[2]);
