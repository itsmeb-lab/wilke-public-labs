import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { project as projectComparison, update as updateComparison } from './organizer-comparison.mjs';

const copy = Object.freeze({
  "prepAnchor": "before-moving",
  "prepHeading": "Before you move the load",
  "prepLead": "Check the source for your service address, exact items and current fee. Confirm who will move the items and where they will go before agreeing to a cleanout."
});
const target = {
  folder: new URL('../milwaukee-bulky-items/', import.meta.url),
  marker: 'MILWAUKEE-BULKY',
  copy,
};

export function project(data) {
  return projectComparison(data, copy);
}

export function update(mode) {
  return updateComparison(mode, target);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) update(process.argv[2]);
