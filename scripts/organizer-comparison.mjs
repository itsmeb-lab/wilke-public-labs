import { readFileSync, writeFileSync } from 'node:fs';
import { parseVisitDate } from '../published-policy-lab/engine.mjs';

const copyByLocale = Object.freeze({
  'en-US': {
    labels: { listed: 'Listed by organizer', excluded: 'Excluded', paused: 'No current need', ask: 'Ask first', unknown: 'Unconfirmed' },
    chooser: 'Choose an item',
    chooseAgain: 'Choose another item',
    reviewed: 'Snapshot reviewed',
    sourceReviewed: 'reviewed',
    unknown: 'The checked rules leave this item unclear. Confirm with the organizer.',
    contact: 'Check with',
  },
  'es-US': {
    labels: { listed: 'Publicado por la entidad', excluded: 'No se acepta', paused: 'Sin necesidad por ahora', ask: 'Consulte primero', unknown: 'Sin confirmar' },
    chooser: 'Elija un artículo',
    chooseAgain: 'Elija otro artículo',
    reviewed: 'Información revisada el',
    sourceReviewed: 'revisada el',
    unknown: 'Las reglas revisadas no aclaran este punto. Consulte con la entidad.',
    contact: 'Consulte con',
  },
});
const escapeHtml = (value) => value.replace(/[&<>"']/g, (ch) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[ch]);
const validSlug = (value) => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

function indexById(records, kind) {
  if (!Array.isArray(records) || !records.length) throw new Error(`Missing ${kind} records.`);
  const index = new Map();
  for (const record of records) {
    if (!validSlug(record?.id) || index.has(record.id)) throw new Error(`Invalid or duplicate ${kind} ID.`);
    index.set(record.id, record);
  }
  return index;
}

function validate(data, prepAnchor) {
  const reservedAnchors = new Set(['main', 'items', 'notes-title', prepAnchor]);
  if (!parseVisitDate(data.checkedOn)) throw new Error('A snapshot review date is required.');
  const operators = indexById(data.operators, 'operator');
  const tasks = indexById(data.tasks, 'item');
  const sources = new Map(Object.entries(data.sources));
  const sourceOwners = new Map();
  for (const [id, source] of sources) {
    const url = new URL(source.url);
    if (!validSlug(id) || !hasText(source.label) || url.protocol !== 'https:' || url.username || url.password || url.port) {
      throw new Error(`Invalid organizer source ${id}.`);
    }
    if (!parseVisitDate(source.checkedOn) || source.checkedOn > data.checkedOn) {
      throw new Error(`Invalid source review date for ${id}.`);
    }
  }

  for (const operator of operators.values()) {
    const { id, country, jurisdiction, visitSource, sourceIds, prep } = operator;
    if (!hasText(operator.name) || !hasText(operator.area) || !/^[A-Z]{2}$/.test(country) ||
        !validSlug(jurisdiction) || !jurisdiction.startsWith(`${country.toLowerCase()}-`)) {
      throw new Error(`Invalid operator identity ${id}.`);
    }
    if (!Array.isArray(sourceIds) || !sourceIds.includes(visitSource) || !Array.isArray(prep) || !prep.length) {
      throw new Error(`Missing organizer routes or visit steps for ${id}.`);
    }
    for (const source of sourceIds) {
      if (!sources.has(source) || sourceOwners.has(source)) throw new Error(`Invalid or shared source ${source}.`);
      sourceOwners.set(source, id);
    }
    for (const step of prep) {
      if (!hasText(step.label) || !hasText(step.text) || !sourceIds.includes(step.source) ||
          (step.extraSource !== undefined && !sourceIds.includes(step.extraSource))) {
        throw new Error(`Invalid visit step for ${id}.`);
      }
    }
  }
  for (const task of tasks.values()) {
    if (!hasText(task.label) || reservedAnchors.has(task.id) || task.id.endsWith('-title')) {
      throw new Error(`Invalid item label or reserved anchor ${task.id}.`);
    }
  }

  const rules = new Map();
  for (const rule of data.rules) {
    const key = `${rule.operator}:${rule.task}`;
    if (!operators.has(rule.operator) || !tasks.has(rule.task) || !sourceOwners.has(rule.source) ||
        sourceOwners.get(rule.source) !== rule.operator || rule.fit === 'unknown' || !Object.hasOwn(copyByLocale['en-US'].labels, rule.fit) ||
        !hasText(rule.text) || rules.has(key)) {
      throw new Error(`Invalid or duplicate scoped rule ${key}.`);
    }
    rules.set(key, rule);
  }
  return { operators, tasks, sources, rules };
}


const comparisonColumns = ['record_id', 'operator_id', 'operator_name', 'area', 'country', 'jurisdiction', 'item_id', 'item', 'fit', 'rule', 'policy_source', 'source_checked_on', 'organizer_route', 'snapshot_reviewed_on'];

function joinedRows({ operators, tasks, sources, rules }, reviewedOn) {
  const rows = [];
  for (const task of tasks.values()) {
    for (const operator of operators.values()) {
      const rule = rules.get(operator.id + ':' + task.id);
      const source = rule && sources.get(rule.source);
      rows.push({
        record_id: operator.id + ':' + task.id, operator_id: operator.id, operator_name: operator.name,
        area: operator.area, country: operator.country, jurisdiction: operator.jurisdiction,
        item_id: task.id, item: task.label, fit: rule?.fit ?? 'unknown', rule: rule?.text ?? '',
        policy_source: source?.url ?? '', source_checked_on: source?.checkedOn ?? '',
        organizer_route: sources.get(operator.visitSource).url, snapshot_reviewed_on: reviewedOn,
      });
    }
  }
  return rows;
}

export function comparisonRecords(data) {
  return joinedRows(validate(data), data.checkedOn);
}

export function serializeCsv(rows) {
  return rows.map((row) => row.map((value) => {
    if (/^[\s\uFEFF]*[=+@-]|^[\t\r\n]/u.test(value)) throw new Error('Unsafe spreadsheet cell.');
    return `"${value.replaceAll('"', '""')}"`;
  }).join(',')).join('\r\n') + '\r\n';
}

export function project(data, { prepAnchor, prepHeading, prepLead, locale = 'en-US' }) {
  if (!Object.hasOwn(copyByLocale, locale)) throw new Error('Unsupported comparison language.');
  const { labels, chooser, chooseAgain, reviewed, sourceReviewed, unknown, contact } = copyByLocale[locale];
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' });
  if (!validSlug(prepAnchor) || ['main', 'items'].includes(prepAnchor) || prepAnchor.endsWith('-title') ||
      !hasText(prepHeading) || !hasText(prepLead)) throw new Error('Invalid comparison visit section.');
  const { operators, tasks, sources, rules } = validate(data, prepAnchor);
  const cite = (id) => {
    const source = sources.get(id);
    const text = source.checkedOn === data.checkedOn ? '' : ` (${sourceReviewed} <time datetime="${source.checkedOn}">${dateFormat.format(new Date(source.checkedOn))}</time>)`;
    return `<a href="${escapeHtml(source.url)}">${escapeHtml(source.label)}</a>${text}`;
  };
  const navigation = [...tasks.values()].map(({ id, label }) =>
    `        <li><a href="#${id}">${escapeHtml(label)}</a></li>`).join('\n');
  const sections = [...tasks.values()].map((task) => {
    const cards = [...operators.values()].map((operator) => {
      const rule = rules.get(`${operator.id}:${task.id}`);
      const fit = rule?.fit ?? 'unknown';
      const detail = rule?.text ?? unknown;
      const answerId = `answer--${task.id}--${operator.id}`;
      return `        <li data-operator="${operator.id}" data-fit="${fit}" id="${answerId}" tabindex="-1">
          <h3><a class="answer-link" href="#${answerId}" aria-label="${escapeHtml(operator.name)} — ${escapeHtml(task.label)}">${escapeHtml(operator.name)}</a></h3><p class="area">${escapeHtml(operator.area)}</p>
          <p><span class="fit ${fit}">${labels[fit]}</span></p>
          <p>${escapeHtml(detail)}</p>
          <p class="source">${rule ? cite(rule.source) : `<a href="${escapeHtml(sources.get(operator.visitSource).url)}">${contact} ${escapeHtml(operator.name)}</a>`}</p>
        </li>`;
    }).join('\n');
    return `    <section id="${task.id}" class="comparison" aria-labelledby="${task.id}-title" tabindex="-1">
      <h2 id="${task.id}-title">${escapeHtml(task.label)}</h2>
      <ul class="cards" role="list">
${cards}
      </ul>
      <p class="return"><a href="#items">${chooseAgain}</a></p>
    </section>`;
  }).join('\n');
  const visits = [...operators.values()].map((operator) => {
    const steps = operator.prep.map(({ label, text, source, extraSource }) => `
            <dt>${escapeHtml(label)}</dt><dd>${escapeHtml(text)} <span class="source">${cite(source)}${extraSource ? ` · ${cite(extraSource)}` : ''}</span></dd>`).join('');
    return `        <li>
          <h3>${escapeHtml(operator.name)}</h3><p class="area">${escapeHtml(operator.area)}</p>
          <dl>${steps}
          </dl>
          <p>${cite(operator.visitSource)}</p>
        </li>`;
  }).join('\n');
  const block = `    <nav id="items" class="choices" aria-label="${chooser}" tabindex="-1">
      <p>${chooser}</p>
      <ul role="list">
${navigation}
        <li><a href="#${prepAnchor}">${escapeHtml(prepHeading)}</a></li>
      </ul>
    </nav>
    <p class="reviewed">${reviewed} <time datetime="${data.checkedOn}">${dateFormat.format(new Date(data.checkedOn))}</time>.</p>
${sections}
    <section id="${prepAnchor}" class="prep" aria-labelledby="${prepAnchor}-title" tabindex="-1">
      <h2 id="${prepAnchor}-title">${escapeHtml(prepHeading)}</h2>
      <p>${escapeHtml(prepLead)}</p>
      <ul class="cards" role="list">
${visits}
      </ul>
    </section>\n`;

  const csvRows = [comparisonColumns, ...joinedRows({ operators, tasks, sources, rules }, data.checkedOn)
    .map((row) => comparisonColumns.map((field) => row[field]))];
  const csv = serializeCsv(csvRows);
  return { block, csv };
}

export function update(mode, { folder, marker, copy, data }) {
  const start = `    <!-- ${marker}:START -->\n`;
  const end = `    <!-- ${marker}:END -->`;
  if (!['--check', '--write'].includes(mode)) throw new Error('Use --check or --write.');
  const htmlPath = new URL('index.html', folder);
  const csvPath = new URL('comparison.csv', folder);
  const html = readFileSync(htmlPath, 'utf8').replaceAll('\r\n', '\n');
  const startAt = html.indexOf(start);
  const endAt = html.indexOf(end);
  if (startAt < 0 || endAt <= startAt || html.lastIndexOf(start) !== startAt || html.lastIndexOf(end) !== endAt) {
    throw new Error(`Expected one ${marker} projection block.`);
  }
  const { block, csv } = project(data ?? JSON.parse(readFileSync(new URL('catalog.json', folder), 'utf8')), copy);
  const projectedHtml = html.slice(0, startAt + start.length) + block + html.slice(endAt);
  if (mode === '--write') {
    writeFileSync(htmlPath, projectedHtml);
    writeFileSync(csvPath, csv);
  } else if (projectedHtml !== html || readFileSync(csvPath, 'utf8').replaceAll('\r\n', '\n') !== csv.replaceAll('\r\n', '\n')) {
    throw new Error(`${marker} HTML or CSV is stale. Review the catalog and run --write.`);
  }
  console.log(`${marker} HTML and CSV projections match the reviewed catalog.`);
}
