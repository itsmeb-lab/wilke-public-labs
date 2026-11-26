import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { update as updateComparison } from './organizer-comparison.mjs';

const original = new URL('../milwaukee-bulky-items/catalog.json', import.meta.url);
const folder = new URL('../milwaukee-articulos-voluminosos/', import.meta.url);
const dictionary = new URL('translation.json', folder);
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

const copy = {
  locale: 'es-US',
  prepAnchor: 'before-moving',
  prepHeading: 'Antes de mover la carga',
  prepLead: 'Confirme la dirección del servicio, los artículos y la tarifa. Aclare quién moverá la carga y a dónde irá.',
};

function requireKeys(expected, records, label) {
  const actual = Object.keys(records);
  if (actual.length !== expected.length || expected.some((key) => !Object.hasOwn(records, key))) {
    throw new Error('Spanish translations do not match the source ' + label + '.');
  }
}

export function localize(catalog, translation) {
  const hash = createHash('sha256').update(JSON.stringify(catalog)).digest('hex');
  if (hash !== translation.sourceHash) throw new Error('The English source catalog changed. Review the Spanish translations against it.');

  requireKeys(Object.keys(catalog.sources), translation.sources, 'citations');
  requireKeys(catalog.tasks.map(({ id }) => id), translation.tasks, 'tasks');
  requireKeys(catalog.operators.map(({ id }) => id), translation.operators, 'operators');
  requireKeys(catalog.rules.map(({ operator, task }) => operator + ':' + task), translation.rules, 'rules');
  const sources = Object.fromEntries(Object.entries(catalog.sources).map(([id, source]) =>
    [id, { ...source, label: translation.sources[id] }]));
  const tasks = catalog.tasks.map((task) => ({ ...task, label: translation.tasks[task.id] }));
  const operators = catalog.operators.map((operator) => {
    const { name, area, prep } = translation.operators[operator.id];
    if (prep.length !== operator.prep.length) throw new Error('Spanish preparation steps do not match ' + operator.id + '.');
    return { ...operator, name, area, prep: operator.prep.map((step, index) => ({ ...step, label: prep[index][0], text: prep[index][1] })) };
  });
  const rules = catalog.rules.map((rule) => ({
    ...rule, text: translation.rules[rule.operator + ':' + rule.task],
  }));
  return { ...catalog, sources, tasks, operators, rules };
}

export function update(mode) {
  const data = localize(readJson(original), readJson(dictionary));
  updateComparison(mode, { folder, marker: 'MILWAUKEE-BULKY-ES', copy, data });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) update(process.argv[2]);
