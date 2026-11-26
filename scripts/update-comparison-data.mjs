import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { comparisonRecords, serializeCsv } from './organizer-comparison.mjs';
import { comparisonGuides } from './review-comparisons.mjs';

const working = new URL('../', import.meta.url);
const live = new URL('https://itsmeb-lab.github.io/wilke-public-labs/');
const folder = 'comparison-data/';
const homepage = new URL(folder, live).href;
const htmlPath = folder + 'index.html';
const csvPath = folder + 'community-comparisons.csv';
const jsonPath = folder + 'community-comparisons.json';
const read = (path) => readFileSync(new URL(path, working), 'utf8');
const fields = [
  'record_id', 'guide', 'operator_id', 'operator_name', 'area', 'country', 'jurisdiction',
  'item_id', 'item', 'fit', 'rule', 'policy_source', 'source_checked_on', 'organizer_route',
  'snapshot_reviewed_on', 'answer_url',
];

export function compileDataset() {
  const records = comparisonGuides.flatMap(({ slug }) => {
    const data = JSON.parse(read(slug + '/catalog.json'));
    return comparisonRecords(data).map((row) => ({
      ...row, guide: slug, record_id: slug + ':' + row.record_id,
      answer_url: new URL(slug + '/#answer--' + row.item_id + '--' + row.operator_id, live).href,
    }));
  });
  const byGuide = new Set(records.map(({ guide }) => guide));
  const byPlace = new Set(records.map(({ country }) => country));
  const byRoute = new Set(records.map(({ guide, operator_id }) => guide + ':' + operator_id));
  const dates = records.map(({ snapshot_reviewed_on }) => snapshot_reviewed_on).sort();
  return {
    schema_version: 1,
    snapshot: {
      guide_count: byGuide.size,
      program_route_count: byRoute.size,
      country_count: byPlace.size,
      reviewed_rule_count: records.filter(({ policy_source }) => policy_source).length,
      unconfirmed_count: records.filter(({ fit }) => fit === 'unknown').length,
      record_count: records.length,
      latest_review_date: dates.at(-1),
    },
    records,
  };
}

function replaceBlock(content, name, block) {
  const start = '    <!-- ' + name + ':START -->\n';
  const end = '    <!-- ' + name + ':END -->';
  const beginAt = content.indexOf(start);
  const endAt = content.indexOf(end);
  if (beginAt < 0 || endAt <= beginAt || content.lastIndexOf(start) !== beginAt || content.lastIndexOf(end) !== endAt) {
    throw new Error('Expected one dataset publication block for ' + name + '.');
  }
  return content.slice(0, beginAt + start.length) + block + content.slice(endAt);
}

export function projectDataset(html, dataset) {
  const summary = dataset.snapshot;
  const meta = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Wilke Public Labs Community Guide Comparison Data',
    description: 'A source-linked dataset of program rules by task, operator, jurisdiction and review date. Includes explicit restrictions and unresolved answers.',
    url: homepage,
    creator: { '@type': 'Organization', name: 'Wilke Public Labs', url: live.href },
    dateModified: summary.latest_review_date,
    variableMeasured: ['Named program', 'Task', 'Policy status', 'Policy source', 'Source review date'],
    distribution: [[csvPath, 'text/csv'], [jsonPath, 'application/json']].map(([path, encodingFormat]) => ({
      '@type': 'DataDownload', encodingFormat, contentUrl: new URL(path, live).href,
    })),
  };
  const label = '      <p>' + summary.record_count + ' task and program records across ' + summary.program_route_count +
    ' program routes, ' + summary.guide_count + ' guides and ' + summary.country_count + ' countries. ' +
    summary.reviewed_rule_count + ' records have a source-linked rule and ' + summary.unconfirmed_count + ' are unconfirmed.</p>\n';
  const date = '      <p>Most recent snapshot review <time datetime="' + summary.latest_review_date + '">' + summary.latest_review_date + '</time>.</p>\n';
  const htmlWithSummary = replaceBlock(html, 'DATA-COVERAGE', label + date);
  const jsonLd = '    <script type="application/ld+json">' + JSON.stringify(meta).replaceAll('<', '\\u003c') + '</script>\n';
  return replaceBlock(htmlWithSummary, 'DATA-METADATA', jsonLd);
}

export function update(mode) {
  if (mode !== '--write' && mode !== '--check') throw new Error('Use --write or --check.');
  const dataset = compileDataset();
  const json = '{\n  "schema_version": ' + dataset.schema_version + ',\n  "snapshot": ' + JSON.stringify(dataset.snapshot) +
    ',\n  "records": [\n' + dataset.records.map((record) => '    ' + JSON.stringify(record)).join(',\n') + '\n  ]\n}\n';
  const csv = serializeCsv([fields, ...dataset.records.map((row) => fields.map((field) => row[field]))]);
  const files = { [htmlPath]: projectDataset(read(htmlPath).replaceAll('\r\n', '\n'), dataset), [csvPath]: csv, [jsonPath]: json };
  for (const [path, content] of Object.entries(files)) {
    if (mode === '--write') {
      writeFileSync(new URL(path, working), content);
    } else if (read(path).replaceAll('\r\n', '\n') !== content.replaceAll('\r\n', '\n')) {
      throw new Error('Dataset publication is stale: ' + path);
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) update(process.argv[2]);
