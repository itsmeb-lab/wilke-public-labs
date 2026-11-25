import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { project as projectComparison, update as updateComparison } from './organizer-comparison.mjs';

const copy = Object.freeze({
  "prepAnchor": "before-you-go",
  "prepHeading": "How to use the drop-off",
  "prepLead": "Check the current location and whether you need to sign up or unlock a cart. The rules below apply to the named public drop-off routes."
});
const target = {
  folder: new URL('../food-scrap-drop-off/', import.meta.url),
  marker: 'FOOD-SCRAP',
  copy,
};

export function project(data) {
  return projectComparison(data, copy);
}

export function update(mode) {
  return updateComparison(mode, target);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) update(process.argv[2]);
