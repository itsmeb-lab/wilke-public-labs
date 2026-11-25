import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const site = new URL('https://itsmeb-lab.github.io/wilke-public-labs/');
export const comparisonGuides = Object.freeze([
  { slug: 'repair-cafe-planner', marker: 'REPAIR-CAFE' },
  { slug: 'shelter-linen-guide', marker: 'SHELTER-LINENS' },
  { slug: 'milwaukee-bulky-items', marker: 'MILWAUKEE-BULKY' },
  { slug: 'food-scrap-drop-off', marker: 'FOOD-SCRAP' },
]);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

function sourceKey(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.port) {
    throw new Error('Use an original HTTPS source URL.');
  }
  url.hash = '';
  return url.href;
}

export function sourceImpact(input) {
  const key = sourceKey(input);
  const matches = [];
  for (const { slug, marker } of comparisonGuides) {
    const { sources, operators, tasks, rules } = JSON.parse(read(slug + '/catalog.json'));
    const ids = new Set(Object.entries(sources).filter(([, source]) => sourceKey(source.url) === key).map(([id]) => id));
    const html = read(slug + '/index.html');
    const start = html.indexOf('<!-- ' + marker + ':START -->');
    const end = html.indexOf('<!-- ' + marker + ':END -->');
    if (start < 0 || end <= start) throw new Error('Missing comparison block for ' + slug);
    const template = html.slice(0, start) + html.slice(end);
    const staticCitations = [...template.matchAll(/href="(https:\/\/[^"]+)"/g)]
      .filter(([, href]) => sourceKey(href.replaceAll('&amp;', '&')) === key).length;
    if (!ids.size && staticCitations === 0) continue;
    const citedRules = rules.filter((rule) => ids.has(rule.source)).map(({ operator, task }) => ({ operator, task }));
    const routeLinks = operators.filter((operator) => ids.has(operator.visitSource)).map((operator) => ({
      operator: operator.id,
      unresolvedItems: tasks.filter((task) => !rules.some((rule) => rule.operator === operator.id && rule.task === task.id)).map((task) => task.id),
    }));
    const preparation = operators.flatMap((operator) => operator.prep
      .filter((step) => ids.has(step.source) || ids.has(step.extraSource)).map((step) => ({ operator: operator.id, step: step.label })));
    matches.push({ page: new URL(slug + '/', site).href, citedRules, routeLinks, preparation, staticCitations });
  }
  return { source: key, matches };
}

export async function checkServed(fetcher = fetch) {
  const expected = new Map([['sitemap.xml', 'sitemap.xml']]);
  for (const { slug } of comparisonGuides) {
    expected.set(slug + '/', slug + '/index.html');
    expected.set(slug + '/comparison.csv', slug + '/comparison.csv');
  }
  const receipts = [];
  for (const [route, path] of expected) {
    const url = new URL(route, site);
    const response = await fetcher(url, { redirect: 'error', signal: AbortSignal.timeout(10000) });
    if (!response.ok || response.status !== 200 || response.url !== url.href) {
      throw new Error('Unexpected response for ' + url.href + ' (HTTP ' + response.status + ').');
    }
    const actual = await response.text();
    const expectedText = read(path);
    if (actual.replaceAll('\r\n', '\n') !== expectedText.replaceAll('\r\n', '\n')) {
      throw new Error('Served content differs from the checked-out file at ' + url.href);
    }
    receipts.push({ url: url.href, status: response.status, bytes: Buffer.byteLength(actual) });
  }
  return receipts;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [operation, ...arguments_] = process.argv.slice(2);
  if (operation === '--source' && arguments_.length === 1) {
    console.log(JSON.stringify(sourceImpact(arguments_[0]), null, 2));
  } else if (operation === '--served' && arguments_.length === 0) {
    console.log(JSON.stringify(await checkServed(), null, 2));
  } else {
    console.error('Use --source <HTTPS URL> or --served.');
    process.exitCode = 1;
  }
}
