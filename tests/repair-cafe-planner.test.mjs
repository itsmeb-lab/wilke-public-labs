import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { project, update } from '../scripts/update-repair-cafe.mjs';

const read = (relative) => readFileSync(new URL(relative, import.meta.url), 'utf8');
const catalog = () => JSON.parse(read('../repair-cafe-planner/catalog.json'));

test('the reviewed catalog matches the checked-in HTML and CSV', () => {
  update('--check');
});

test('comparison keeps a named restriction separate from a listing and an unknown', () => {
  const { block, csv } = project(catalog());
  const microwave = block.split('<section id="microwave"')[1].split('</section>')[0];
  assert.match(microwave, /data-operator="san-francisco" data-fit="excluded"/);
  assert.match(microwave, /data-operator="york-region" data-fit="listed"/);
  assert.match(microwave, /data-operator="toronto" data-fit="unknown"/);
  assert.match(microwave, /href="https:\/\/repaircafetoronto\.ca\/upcoming-events\/">Check with Repair Café Toronto/);
  const csvRows = csv.trimEnd().split('\r\n');
  assert.equal(csvRows.length, 31);
  assert.match(csvRows.find((row) => row.startsWith('"toronto:microwave"')),
    /"unknown","","","","https:\/\/repaircafetoronto\.ca\/upcoming-events\/","2026-11-25"/);
});

test('item restrictions cannot borrow evidence from another operator or duplicate a joined key', () => {
  const data = catalog();
  data.rules[0].source = 'york-guide';
  assert.throws(() => project(data), /Invalid or duplicate scoped rule san-francisco:bicycle/);
  const duplicate = catalog();
  duplicate.rules.push(duplicate.rules[0]);
  assert.throws(() => project(duplicate), /Invalid or duplicate scoped rule san-francisco:bicycle/);
});

test('the exchange preserves the original review date of the specific policy evidence', () => {
  const data = catalog();
  data.sources['york-guide'].checkedOn = '2026-11-24';
  const line = project(data).csv.split('\r\n').find((row) => row.startsWith('"york-region:microwave"'));
  assert.match(line, /"2026-11-24","https:\/\/www\.york\.ca\/[^"\s]+","2026-11-25"$/);
  assert.match(project(data).block, /reviewed <time datetime="2026-11-24">November 24, 2026<\/time>/);
  data.sources['york-guide'].checkedOn = '2026-11-26';
  assert.throws(() => project(data), /Invalid source review date/);
});

test('a task cannot shadow a navigation anchor', () => {
  const data = catalog();
  data.tasks[0].id = 'check-in';
  assert.throws(() => project(data), /reserved anchor/);
});

test('HTML and spreadsheet projections preserve text with their own escaping rules', () => {
  const data = catalog();
  data.rules[0].text = 'A visitor asked about "A & B" <items>.';
  const { block, csv } = project(data);
  assert.match(block, /&quot;A &amp; B&quot; &lt;items&gt;/);
  assert.match(csv, /"A visitor asked about ""A & B"" <items>\."/);
  data.rules[0].text = ' =1+1';
  assert.throws(() => project(data), /Unsafe spreadsheet cell/);
  data.sources['sf-faq'].url = 'https://u:p@repaircafesf.org/faq';
  assert.throws(() => project(data), /Invalid organizer source/);
});

test('the single canonical page is discoverable and every navigation target works without script', () => {
  const html = read('../repair-cafe-planner/index.html');
  const canonical = 'https://itsmeb-lab.github.io/wilke-public-labs/repair-cafe-planner/';
  assert.deepEqual([...html.matchAll(/rel="canonical" href="([^"]+)"/g)].map((match) => match[1]), [canonical]);
  assert.ok(html.includes(`<meta property="og:url" content="${canonical}">`));
  assert.doesNotMatch(html, /<script\b|<form\b|noindex|data-diagnostic-link/);
  for (const [, anchor] of html.matchAll(/href="#([a-z0-9-]+)"/g)) {
    assert.equal([...html.matchAll(new RegExp(`\\bid="${anchor}"`, 'g'))].length, 1);
  }
  assert.ok(read('../index.html').includes('href="./repair-cafe-planner/"'));
  assert.ok(read('../published-policy-lab/index.html').includes('href="../repair-cafe-planner/"'));
  assert.ok(read('../sitemap.xml').includes(`<loc>${canonical}</loc>`));
});
