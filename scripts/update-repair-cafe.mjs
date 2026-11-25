import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { project as projectComparison, update as updateComparison } from './organizer-comparison.mjs';

const copy = Object.freeze({
  "prepAnchor": "check-in",
  "prepHeading": "How to check in",
  "prepLead": "Check the event listing before you leave. Confirm whether you need to sign up, when intake closes and which item categories volunteers will handle."
});
const target = {
  folder: new URL('../repair-cafe-planner/', import.meta.url),
  marker: 'REPAIR-CAFE',
  copy,
};

export function project(data) {
  return projectComparison(data, copy);
}

export function update(mode) {
  return updateComparison(mode, target);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) update(process.argv[2]);
