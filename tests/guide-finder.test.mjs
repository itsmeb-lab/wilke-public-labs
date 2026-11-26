import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { guides, regions } from '../guide-finder/index-data.mjs';
import { buildSearchIndex, searchGuides } from '../guide-finder/search.mjs';
import { update } from '../scripts/update-guide-finder.mjs';

const index = buildSearchIndex(guides);
const search = (query, region = '') => searchGuides(index, { query, region });
const read = (file) => readFileSync(new URL('../' + file, import.meta.url), 'utf8');

test('finder projections stay in sync with the public guide catalogs', () => {
  update('--check');
  assert.equal(guides.length, 16);
  assert.equal(regions.length, 33);
  const html = read('guide-finder/index.html');
  for (const { slug, tasks } of guides) {
    assert.ok(html.includes('href="../' + slug + '/"'), slug);
    for (const { id } of tasks) assert.ok(html.includes('href="../' + slug + '/#' + id + '"'), slug + ':' + id);
  }
});

test('search normalizes common wording and still opens the canonical task', () => {
  assert.equal(search('Can I bring an old microwave to a repair café?')[0].id, 'microwave');
  assert.equal(search('library can I scan 11 × 17?')[0].id, 'tabloid');
  assert.equal(search('can I return unused seeds?')[0].id, 'unused-seeds');
  assert.equal(search('dispose couch Milwaukee')[0].id, 'sofa-or-mattress');
});

test('location filtering and status operate on one named route without joining places', () => {
  const [eyes] = search('donate broken glasses', 'us-ga');
  assert.equal(eyes.id, 'broken-frames');
  assert.deepEqual(eyes.routes.map(({ id, fit }) => [id, fit]), [['georgia-lions', 'listed']]);
  const [lenses] = search('donate loose lenses', 'us-ga');
  assert.equal(lenses.routes[0].fit, 'ask');
  assert.deepEqual(search('Toronto Durham quiet room'), []);
  assert.deepEqual(search('quiet room', 'ca-ns'), []);
  assert.ok(search('', 'us-wi').every(({ routes }) => routes.every((r) => r.region === 'us-wi')));
});

test('specific search avoids joining repairing with donating or hiring with borrowing', () => {
  const [bike] = search('donate rusty bike Milwaukee', 'us-wi');
  assert.equal(bike.id, 'heavy-rust');
  assert.deepEqual(bike.routes.map(({ id, fit }) => [id, fit]), [['milwaukee-bicycle-collective', 'listed']]);
  const [sound] = search('borrow ukulele Sydney', 'au-nsw');
  assert.equal(sound.id, 'take-home');
  assert.equal(search('can my child borrow a ukulele', 'au-nsw')[0].id, 'under-thirteen');
  assert.equal(search('how long can I borrow a ukulele', 'au-nsw')[0].id, 'three-week-loan');
  assert.deepEqual(sound.routes.map(({ id, fit }) => [id, fit]), [['sydney-take-home', 'listed'], ['sydney-room', 'excluded']]);
});

test('the finder distinguishes exact tape formats and source-bound shredding rules', () => {
  const [memory] = search('digitize Hi8', 'us-dc');
  assert.equal(memory.id, 'hi8');
  assert.deepEqual(memory.routes.map(({ id, fit }) => [id, fit]), [['dc-memory-lab', 'excluded']]);
  const [records] = search('watch documents shredded', 'us-nc');
  assert.equal(records.id, 'watch-shredding');
  assert.deepEqual(records.routes.map(({ id, fit }) => [id, fit]), [['orange-county-nc', 'excluded']]);
});

test('a York County park pass hold resolves to the South Carolina rule', () => {
  const [park] = search('hold state park pass York County', 'us-sc');
  assert.equal(park.id, 'library-hold');
  assert.deepEqual(park.routes.map(({ id, fit }) => [id, fit]), [['york-county-sc', 'excluded']]);
});

test('ordinary wording opens the named local guide without inferring a location', () => {
  const cases = [
    ["free document shredding near me","us-wi","household-document-shredding#without-appointment"],
    ["borrow a library tool near me","us-sc","tool-library-borrowing#household-borrower"],
    ["do I need a library card to get seeds","ca-on","library-seed-borrowing#without-card"],
    ["community bike donations near me","us-wi","used-bicycle-donations#working-bike"],
    ["where can I donate this rusty bike Milwaukee","us-wi","used-bicycle-donations#heavy-rust"],
    ["can I use this library park pass for camping","us-ca","library-state-park-passes#overnight-camping"],
    ["get into park with library pass","ca-on","library-state-park-passes#day-vehicle-entry"],
    ["digitize vhs at library near me","us-ca","library-memory-labs#vhs"],
    ["convert hi8 tapes to usb","ca-bc","library-memory-labs#hi8"],
    ["is there a quiet room at the library","us-nc","library-sensory-spaces#dedicated-room"],
    ["scan paper to usb at a library","us-wi","library-scanning#usb"],
    ["donate broken glasses near me","us-wi","eyeglass-donation-rules#broken-frames"],
    ["what are the bulk pickup rules for a couch","us-wi","milwaukee-bulky-items#sofa-or-mattress"],
    ["who takes spare bicycle parts","us-mn","used-bicycle-donations#spare-parts"],
  ];
  for (const [question, region, expected] of cases) {
    const [result] = search(question, region);
    assert.equal(result?.slug + '#' + result?.id, expected, question);
    assert.ok(result.routes.every(({ region: routeRegion }) => routeRegion === region), question);
  }
  assert.deepEqual(search('near me'), []);
  assert.deepEqual(search('Toronto Durham quiet room'), []);
});

test('search fields stay in the page, with an ordinary link list as the fallback', () => {
  const html = read('guide-finder/index.html');
  const app = read('guide-finder/app.mjs');
  assert.match(html, /<noscript><style>#finder\s*\{\s*display:\s*none/);
  assert.match(html, /id="lookup"[^>]* disabled/);
  assert.match(html, /id="region"[^>]* disabled/);
  assert.match(html, /role="status">Start with a task or choose a region\.<\/p>/);
  assert.match(app, /query\.disabled = false/);
  assert.match(app, /region\.disabled = false/);
  assert.doesNotMatch(app, /\.hidden\s*=/);
  assert.doesNotMatch(html, /<form\b|<script[^>]*https:/);
  assert.doesNotMatch(app, /\bfetch\(|\bnavigator\.sendBeacon|localStorage|sessionStorage|innerHTML/);
  assert.match(app, /child\.textContent = value/);
  assert.deepEqual(search('', ''), []);
});
