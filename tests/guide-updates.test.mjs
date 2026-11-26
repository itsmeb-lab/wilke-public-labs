import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(new URL('../' + file, import.meta.url), 'utf8');

test('the RSS feed advertises each newly published canonical URL once', () => {
  const xml = read('guide-updates.xml');
  const home = read('index.html');
  const sitemap = read('sitemap.xml');
  const items = [...xml.matchAll(/<item>([\s\S]+?)<\/item>/g)].map((match) => match[1]);
  const urls = items.map((item) => item.match(/<link>([^<]+)<\/link>/)?.[1]);
  const published = items.map((item) => Date.parse(item.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1]));
  assert.equal(items.length, 14);
  assert.equal(urls[0], 'https://itsmeb-lab.github.io/wilke-public-labs/milwaukee-junk-removal/');
  assert.equal(new Set(urls).size, items.length);
  assert.match(xml, /<rss version="2\.0"/);
  assert.match(home, /rel="alternate" type="application\/rss\+xml"[^>]*href="\.\/guide-updates\.xml"/);
  assert.ok(home.includes('Guide updates (RSS)'));
  for (const [i, item] of items.entries()) {
    assert.ok(sitemap.includes('<loc>' + urls[i] + '</loc>'));
    assert.ok(item.includes('<guid isPermaLink="true">' + urls[i] + '</guid>'));
    assert.ok(!Number.isNaN(published[i]) && (!i || published[i] <= published[i - 1]));
    assert.match(item, /<title>[^<]+<\/title>/);
    assert.match(item, /<description>[^<]+<\/description>/);
  }
});
