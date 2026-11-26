import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeHtml as html, serializeCsv } from './organizer-comparison.mjs';
import { parseVisitDate } from '../published-policy-lab/engine.mjs';

const folder = new URL('../hardwood-finish-return/', import.meta.url);
const start = '<!-- FINISH-PRODUCTS:START -->';
const end = '<!-- FINISH-PRODUCTS:END -->';
const statuses = { listed: '', confirm: 'Confirm for your floor', conflict: 'Published times differ' };
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const columns = ['product_id', 'product_name', 'scope', 'activity', 'status', 'guidance', 'primary_source', 'source_reviewed_on'];
const hasText = (value) => typeof value === 'string' && Boolean(value.trim());

function checkIdentities(rows) {
  const ids = rows.map(({ id }) => id);
  if (!ids.length || ids.some((id) => !slug.test(id)) || new Set(ids).size !== ids.length) {
    throw new Error('Each activity or product needs a distinct ID.');
  }
}

export function project(data) {
  const { checkedOn, activities, products } = data;
  if (!parseVisitDate(checkedOn)) throw new Error('A review date is required.');
  checkIdentities(activities);
  checkIdentities(products);
  if (activities.some(({ label }) => !hasText(label))) throw new Error('Each activity needs a label.');

  const rows = [];
  const productCards = products.map((product) => {
    const { id, name, scope, sources, guidance } = product;
    if (!hasText(name) || !hasText(scope) || !Array.isArray(sources) || !sources.length ||
        !guidance || Object.keys(guidance).length !== activities.length) {
      throw new Error('Incomplete product data for ' + id + '.');
    }
    for (const { label, url } of sources) {
      const link = new URL(url);
      if (!hasText(label) || link.protocol !== 'https:' || link.username || link.password || link.port) {
        throw new Error('Use a named HTTPS manufacturer source for ' + id + '.');
      }
    }
    const details = activities.map(({ id: activityId, label }) => {
      const entry = guidance[activityId];
      const source = entry && sources[entry.source ?? 0];
      if (!entry || !Object.hasOwn(statuses, entry.status) || !hasText(entry.text) || !source) {
        throw new Error('Missing sourced guidance for ' + id + ' and ' + activityId + '.');
      }
      rows.push([id, name, scope, label, entry.status, entry.text, source.url, checkedOn]);
      const status = statuses[entry.status];
      return `        <div id="${id}-${activityId}" data-status="${entry.status}">
          <dt>${html(label)}</dt>
          <dd>${status ? `<strong class="finish-status">${html(status)}.</strong> ` : ''}${html(entry.text)} <span class="source"><a href="${html(source.url)}">${html(source.label)}</a></span></dd>
        </div>`;
    }).join('\n');
    return `    <article class="finish-product" id="${id}" aria-labelledby="${id}-title">
      <h3 id="${id}-title">${html(name)}</h3>
      <p class="finish-scope">${html(scope)}</p>
      <dl class="finish-activities">
${details}
      </dl>
    </article>`;
  });
  const navigation = products.map(({ id, name }) => `        <li><a href="#${id}">${html(name)}</a></li>`).join('\n');
  return {
    block: `    <nav class="choices" aria-label="Choose a finish">
      <ul role="list">
${navigation}
      </ul>
    </nav>
    <div class="finish-products">
${productCards.join('\n')}
    </div>`,
    csv: serializeCsv([columns, ...rows]),
  };
}

export function update(mode) {
  if (!['--check', '--write'].includes(mode)) throw new Error('Use --check or --write.');
  const input = new URL('catalog.json', folder);
  const page = new URL('index.html', folder);
  const csvPath = new URL('finish-guidance.csv', folder);
  const source = JSON.parse(readFileSync(input, 'utf8'));
  const file = readFileSync(page, 'utf8').replaceAll('\r\n', '\n');
  if (file.split(start).length !== 2 || file.split(end).length !== 2 || file.indexOf(end) <= file.indexOf(start)) {
    throw new Error('Expected one finish product block.');
  }
  const { block, csv } = project(source);
  const result = file.slice(0, file.indexOf(start) + start.length) + '\n' + block + '\n    ' + file.slice(file.indexOf(end));
  if (mode === '--write') {
    writeFileSync(page, result);
    writeFileSync(csvPath, csv);
  } else if (file !== result || readFileSync(csvPath, 'utf8').replaceAll('\r\n', '\n') !== csv.replaceAll('\r\n', '\n')) {
    throw new Error('Finish guide outputs differ from the reviewed catalog.');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  update(process.argv[2]);
}
