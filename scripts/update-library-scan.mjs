import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { project as projectComparison, update as updateComparison } from './organizer-comparison.mjs';

const copy = Object.freeze({
  "prepAnchor": "before-you-go",
  "prepHeading": "Before you visit",
  "prepLead": "Check which branch has the output and scanner you need. A guest computer login, printing fee or fax limit can have different terms from scanning."
});
const target = {
  folder: new URL('../library-scanning/', import.meta.url),
  marker: 'LIBRARY-SCAN',
  copy,
};

export function project(data) {
  return projectComparison(data, copy);
}

export function update(mode) {
  return updateComparison(mode, target);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) update(process.argv[2]);
