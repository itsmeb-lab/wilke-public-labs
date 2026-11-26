import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { chooseRoute } from '../milwaukee-junk-removal/routes.mjs';

const root = new URL('../', import.meta.url);
const read = (file) => readFileSync(new URL(file, root), 'utf8');
const page = read('milwaukee-junk-removal/index.html');
const choose = (items, handling = 'self', authority = 'cleared') => chooseRoute({ authority, handling, items });

test('an unresolved removal permission takes priority over every paid or self-service route', () => {
  for (const items of ['bulky', 'reusable', 'mixed', 'separate', 'hazards', '']) {
    for (const handling of ['self', 'crew', '']) {
      assert.match(choose(items, handling, 'unresolved').heading, /^Confirm which items/);
      assert.match(choose(items, handling, 'unresolved').link, /datcp\.wi\.gov/);
      assert.equal(choose(items, handling, '').link, undefined);
    }
  }
});

test('materials needing separate handling stay out of ordinary crew or self-service recommendations', () => {
  for (const handling of ['self', 'crew', '']) {
    assert.match(choose('hazards', handling).link, /^https:\/\/www\.mmsd\.com\//);
    assert.equal(choose('separate', handling).link, '../milwaukee-bulky-items/');
  }
});

test('the buyer sees the matching municipal, donation, separation or written quote route', () => {
  assert.equal(choose('bulky').link, '#municipalities');
  assert.match(choose('reusable').link, /\/Donating$/);
  assert.equal(choose('mixed').link, '../milwaukee-bulky-items/#mixed-cleanout');
  for (const items of ['bulky', 'reusable', 'mixed']) assert.equal(choose(items, 'crew').link, '#quote-scope');
  assert.match(choose('reusable', 'crew').detail, /donation pickup/);
  assert.equal(choose('unrecognized', 'crew').link, undefined);
  assert.equal(choose('bulky', '').link, undefined);
});

test('the uncoupled public guide has six directly sourced city summaries and a tagged service link', () => {
  const cities = [...page.matchAll(/<li id="city-([^"]+)">([\s\S]+?)<\/li>/g)];
  assert.deepEqual(cities.map(([, id]) => id), ['milwaukee', 'west-allis', 'wauwatosa', 'glendale', 'south-milwaukee', 'brookfield']);
  for (const [, id, section] of cities) {
    assert.match(section, /class="source"><a href="https:\/\//, id);
  }
  const destination = new URL(page.match(/data-cleanout-service href="([^"]+)"/)[1].replaceAll('&amp;', '&'));
  assert.equal(destination.origin, 'https://wilkeservices.com');
  assert.equal(destination.pathname, '/property/estate-rental-cleanouts');
  assert.deepEqual(Object.fromEntries(destination.searchParams), {
    utm_source: 'wilke_public_labs',
    utm_medium: 'referral',
    utm_campaign: 'milwaukee_cleanouts',
    utm_content: 'planner_scope',
  });
  for (const file of ['index.html', 'milwaukee-bulky-items/index.html', 'milwaukee-cleanout-floor-handoff/index.html', 'sitemap.xml', 'guide-updates.xml']) {
    assert.match(read(file), /milwaukee-junk-removal\//, file);
  }
});

test('the route selector requires no submission, identity fields, browser storage or network request', () => {
  assert.match(page, /id="route-planner" hidden/);
  assert.match(page, /id="quote-scope"/);
  assert.doesNotMatch(page, /<form\b|<input\b|<textarea\b|<script[^>]+https?:|<meta name="robots"/i);
  const sources = ['planner.mjs', 'routes.mjs'].map(file => read('milwaukee-junk-removal/' + file)).join('\n');
  assert.doesNotMatch(sources, /\bfetch\(|sendBeacon|XMLHttpRequest|localStorage|sessionStorage|innerHTML/);
  assert.match(sources, /title\.textContent = route\.heading/);
  assert.match(sources, /result\.focus\(\)/);
});
