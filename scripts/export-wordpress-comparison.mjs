import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serializeCsv } from './organizer-comparison.mjs';
import { comparisonGuides, localizedGuides } from './review-comparisons.mjs';
import { localize } from './update-milwaukee-bulky-es.mjs';

const site = 'https://itsmeb-lab.github.io/wilke-public-labs/';
const root = new URL('../', import.meta.url);
const output = new URL('wordpress-exchange/comparisons-draft.csv', root);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

function field(html, pattern, label) {
  const all = [...html.matchAll(pattern)];
  if (all.length !== 1 || !all[0][1].trim()) throw new Error('Expected one ' + label + '.');
  return all[0][1];
}

export function guideDraftData(slug) {
  const guide = [...comparisonGuides, ...localizedGuides].find((entry) => entry.slug === slug);
  if (!guide) throw new Error('Unknown comparison guide.');
  const html = read(slug + '/index.html');
  const language = field(html, /<html\b[^>]*\blang="([A-Za-z]{2,8}(?:-[A-Za-z0-9]{2,8})*)"/g, 'guide language');
  const published = new URL(slug + '/', site);
  const canonical = field(html, /<link rel="canonical" href="([^"]+)">/g, 'canonical URL');
  if (canonical !== published.href) throw new Error('Unexpected canonical: ' + canonical);
  const heading = field(html, /<h1>([^<>]+)<\/h1>/g, 'heading');
  const description = field(html, /<meta name="description" content="([^"]+)">/g, 'description');
  const main = field(html, /<main\b[^>]*>([\s\S]+?)<\/main>/g, 'guide content');
  if (/<(?:script|iframe|object|embed|form|style)\b/i.test(main)) throw new Error('Expected static comparison HTML.');
  const publishedBody = main.replace(/<h1>[^<>]+<\/h1>\s*/, '').trim();
  const body = publishedBody.replace(/href="([^"]+)"/g, (whole, href) => {
    if (href.startsWith('#')) return whole;
    const link = new URL(href.replaceAll('&amp;', '&'), published);
    if (link.protocol !== 'https:' || link.username || link.password) throw new Error('Expected HTTPS source link.');
    const safe = link.href.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
    return 'href="' + safe + '"';
  });
  const catalog = JSON.parse(read((guide.catalogSlug ?? slug) + '/catalog.json'));
  if (guide.catalogSlug) localize(catalog, JSON.parse(read(slug + '/translation.json')));
  return { language, row: [slug, heading, description, canonical, catalog.checkedOn, 'STAGING_DRAFT_ONLY', body] };
}

export function guideRow(slug) {
  return guideDraftData(slug).row;
}

export function buildExchange() {
  return serializeCsv([
    ['slug', 'heading', 'description', 'canonical_reference', 'reviewed_on', 'publication_state', 'comparison_html'],
    ...comparisonGuides.map(({ slug }) => guideRow(slug)),
  ]);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [mode] = process.argv.slice(2);
  if (mode === '--write') {
    writeFileSync(output, buildExchange());
  } else if (mode === '--check') {
    if (readFileSync(output, 'utf8').replaceAll('\r\n', '\n') !== buildExchange().replaceAll('\r\n', '\n')) {
      throw new Error('WordPress exchange is stale. Review the guides and regenerate the draft data.');
    }
  } else {
    console.error('Use --check or --write.');
    process.exitCode = 1;
  }
}
