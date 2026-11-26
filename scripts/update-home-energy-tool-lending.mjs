import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { project as projectComparison, update as updateComparison } from './organizer-comparison.mjs';

const copy = Object.freeze({
  prepAnchor: 'plan-pickup',
  prepHeading: 'Plan pickup and return',
  prepLead: 'Confirm your specific kit and pickup location before traveling.',
});

const target = {
  folder: new URL('../home-energy-tool-lending/', import.meta.url),
  marker: 'HOME-ENERGY-TOOL-LENDING',
  copy,
};

export function project(data) {
  return projectComparison(data, copy);
}

export function update(mode) {
  return updateComparison(mode, target);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) update(process.argv[2]);
