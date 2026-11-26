import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseVisitDate } from '../published-policy-lab/engine.mjs';

const root = new URL('../', import.meta.url);
const site = new URL('https://itsmeb-lab.github.io/wilke-public-labs/');
export const comparisonGuides = Object.freeze([
  { slug: 'repair-cafe-planner', marker: 'REPAIR-CAFE' },
  { slug: 'shelter-linen-guide', marker: 'SHELTER-LINENS' },
  { slug: 'milwaukee-bulky-items', marker: 'MILWAUKEE-BULKY' },
  { slug: 'food-scrap-drop-off', marker: 'FOOD-SCRAP' },
  { slug: 'library-scanning', marker: 'LIBRARY-SCAN' },
  { slug: 'library-museum-passes', marker: 'LIBRARY-MUSEUM-PASSES' },
  { slug: 'library-seed-borrowing', marker: 'LIBRARY-SEED-BORROWING' },
  { slug: 'tool-library-borrowing', marker: 'TOOL-LIBRARY-BORROWING' },
  { slug: 'library-sensory-spaces', marker: 'LIBRARY-SENSORY-SPACES' },
  { slug: 'eyeglass-donation-rules', marker: 'EYEGLASS-DONATION-RULES' },
  { slug: 'library-instrument-borrowing', marker: 'LIBRARY-INSTRUMENT-BORROWING' },
  { slug: 'used-bicycle-donations', marker: 'USED-BICYCLE-DONATIONS' },
  { slug: 'library-memory-labs', marker: 'LIBRARY-MEMORY-LABS' },
  { slug: 'household-document-shredding', marker: 'HOUSEHOLD-DOCUMENT-SHREDDING' },
  { slug: 'library-state-park-passes', marker: 'LIBRARY-STATE-PARK-PASSES' },
]);
const localizedGuides = Object.freeze([
  { slug: 'milwaukee-articulos-voluminosos', marker: 'MILWAUKEE-BULKY-ES', catalogSlug: 'milwaukee-bulky-items' },
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
  for (const { slug, marker, catalogSlug = slug } of [...comparisonGuides, ...localizedGuides]) {
    const { sources, operators, tasks, rules } = JSON.parse(read(catalogSlug + '/catalog.json'));
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

export function sourcesReviewedBefore(cutoff) {
  if (!parseVisitDate(cutoff)) throw new Error('Give a calendar date in YYYY-MM-DD format.');
  return comparisonGuides.flatMap(({ slug }) => {
    const { sources } = JSON.parse(read(slug + '/catalog.json'));
    return Object.values(sources).filter(({ checkedOn }) => checkedOn < cutoff).map(({ label, url, checkedOn }) => ({
      page: new URL(slug + '/', site).href, label, url, checkedOn,
    }));
  }).sort((a, b) => a.checkedOn.localeCompare(b.checkedOn) || a.url.localeCompare(b.url));
}

export async function checkRobots(fetcher = fetch) {
  const url = new URL('/robots.txt', site);
  const response = await fetcher(url, { redirect: 'error', signal: AbortSignal.timeout(10000) });
  if (response.url !== url.href || ![200, 404].includes(response.status)) {
    throw new Error('Unexpected robots.txt response (HTTP ' + response.status + ').');
  }
  const directives = response.ok
    ? (await response.text()).split(/\r?\n/).filter((line) => /^\s*(?:user-agent|allow|disallow|sitemap)\s*:/i.test(line))
    : [];
  return { url: url.href, status: response.status, directives };
}

export async function checkServed(fetcher = fetch) {
  const expected = new Map([
    ['', 'index.html'],
    ['lab-site.css?v=20261125-2', 'lab-site.css'],
    ['repair-cafe-planner/style.css?v=20261125-2', 'repair-cafe-planner/style.css'],
    ['sitemap.xml', 'sitemap.xml'],
    ['guide-updates.xml', 'guide-updates.xml'],
    ['published-policy-lab/', 'published-policy-lab/index.html'],
    ['published-policy-lab/wood-chip-load.mjs?v=20261125-1', 'published-policy-lab/wood-chip-load.mjs'],
    ['published-policy-lab/wood-chip-load.css?v=20261125-1', 'published-policy-lab/wood-chip-load.css'],
    ['wordpress-exchange/comparisons-draft.csv', 'wordpress-exchange/comparisons-draft.csv'],
    ['milwaukee-cleanout-floor-handoff/', 'milwaukee-cleanout-floor-handoff/index.html'],
    ['milwaukee-cleanout-floor-handoff/worksheet.css?v=20261126-1', 'milwaukee-cleanout-floor-handoff/worksheet.css'],
    ['milwaukee-cleanout-floor-handoff/quote-compare.mjs', 'milwaukee-cleanout-floor-handoff/quote-compare.mjs'],
    ['milwaukee-cleanout-floor-handoff/quote-math.mjs', 'milwaukee-cleanout-floor-handoff/quote-math.mjs'],
    ['milwaukee-junk-removal/', 'milwaukee-junk-removal/index.html'],
    ['milwaukee-junk-removal/planner.css', 'milwaukee-junk-removal/planner.css'],
    ['milwaukee-junk-removal/planner.mjs', 'milwaukee-junk-removal/planner.mjs'],
    ['milwaukee-junk-removal/routes.mjs', 'milwaukee-junk-removal/routes.mjs'],
    ['estimate-change-calculator/', 'estimate-change-calculator/index.html'],
    ['estimate-change-calculator/change.css', 'estimate-change-calculator/change.css'],
    ['estimate-change-calculator/change-calculator.mjs', 'estimate-change-calculator/change-calculator.mjs'],
    ['estimate-change-calculator/change-math.mjs', 'estimate-change-calculator/change-math.mjs'],
    ['hardwood-finish-return/', 'hardwood-finish-return/index.html'],
    ['hardwood-finish-return/finish.css', 'hardwood-finish-return/finish.css'],
    ['hardwood-finish-return/catalog.json', 'hardwood-finish-return/catalog.json'],
    ['hardwood-finish-return/finish-guidance.csv', 'hardwood-finish-return/finish-guidance.csv'],
    ['guide-finder/', 'guide-finder/index.html'],
    ['guide-finder/finder.css', 'guide-finder/finder.css'],
    ['guide-finder/app.mjs', 'guide-finder/app.mjs'],
    ['guide-finder/search.mjs', 'guide-finder/search.mjs'],
    ['guide-finder/index-data.mjs', 'guide-finder/index-data.mjs'],
    ['comparison-data/', 'comparison-data/index.html'],
    ['comparison-data/community-comparisons.csv', 'comparison-data/community-comparisons.csv'],
    ['comparison-data/community-comparisons.json', 'comparison-data/community-comparisons.json'],
  ]);
  for (const { slug } of [...comparisonGuides, ...localizedGuides]) {
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
    const contentType = response.headers.get('content-type');
    const robotsHeader = response.headers.get('x-robots-tag');
    if (path.endsWith('.html')) {
      if (!/^text\/html\b/i.test(contentType ?? '')) throw new Error('Expected HTML for ' + url.href);
      const canonicals = [...actual.matchAll(/<link rel="canonical" href="([^"]+)">/g)].map((match) => match[1]);
      if (canonicals.length !== 1 || canonicals[0] !== url.href) throw new Error('Canonical differs for ' + url.href);
      const pageRobots = [...actual.matchAll(/<meta name="(?:robots|googlebot)" content="([^"]+)"/gi)].map((match) => match[1]).join(',');
      if (/\b(?:noindex|none)\b/i.test([robotsHeader, pageRobots].join(','))) throw new Error('Indexing exclusion on ' + url.href);
    }
    receipts.push({ url: url.href, status: response.status, bytes: Buffer.byteLength(actual), contentType, robotsHeader });
  }
  return receipts;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [operation, ...arguments_] = process.argv.slice(2);
  if (operation === '--source' && arguments_.length === 1) {
    console.log(JSON.stringify(sourceImpact(arguments_[0]), null, 2));
  } else if (operation === '--served' && arguments_.length === 0) {
    console.log(JSON.stringify(await checkServed(), null, 2));
  } else if (operation === '--robots' && arguments_.length === 0) {
    console.log(JSON.stringify(await checkRobots(), null, 2));
  } else if (operation === '--reviewed-before' && arguments_.length === 1) {
    console.log(JSON.stringify(sourcesReviewedBefore(arguments_[0]), null, 2));
  } else {
    console.error('Use --source <HTTPS URL>, --reviewed-before <YYYY-MM-DD>, --served or --robots.');
    process.exitCode = 1;
  }
}
