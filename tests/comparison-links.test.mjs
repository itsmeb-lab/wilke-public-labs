import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { comparisonGuides } from '../scripts/review-comparisons.mjs';
import { guideRow } from '../scripts/export-wordpress-comparison.mjs';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('every comparison answer has a unique stable link scoped to its item and provider', () => {
  for (const { slug } of comparisonGuides) {
    const html = read(slug + '/index.html');
    const { operators, tasks } = JSON.parse(read(slug + '/catalog.json'));
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length, slug);
    for (const task of tasks) {
      const section = html.split('<section id="' + task.id + '"')[1].split('</section>')[0];
      for (const operator of operators) {
        const answer = 'answer--' + task.id + '--' + operator.id;
        assert.ok(section.includes('id="' + answer + '" tabindex="-1"'), answer);
        assert.ok(section.includes('class="answer-link" href="#' + answer + '"'), answer);
      }
    }
  }
});

test('home task shortcuts resolve to public content without a search script', () => {
  const home = read('index.html');
  const nav = home.split('aria-label="Jump to an answer"')[1].split('</nav>')[0];
  const links = [...nav.matchAll(/href="\.\/([a-z-]+)\/#([a-z-]+)"/g)];
  assert.equal(links.length, 10);
  for (const [, folder, anchor] of links) {
    assert.ok(read(folder + '/index.html').includes('id="' + anchor + '"'), folder + '#' + anchor);
  }
  assert.doesNotMatch(nav, /<script\b|<form\b/);
});

test('WordPress draft preserves both ends of a local comparison link', () => {
  const body = guideRow('library-scanning')[6];
  assert.match(body, /href="#answer--email--brunswick"/);
  assert.match(body, /data-operator="brunswick" data-fit="excluded" id="answer--email--brunswick"/);
});
