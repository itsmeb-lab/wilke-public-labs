import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const site = 'https://itsmeb-lab.github.io/wilke-public-labs/';
const feed = readFileSync(new URL('../guide-updates.xml', import.meta.url), 'utf8');
const urls = [...feed.matchAll(/<item>[\s\S]+?<link>([^<]+)<\/link>/g)].map((match) => match[1]);
const [mode, batch, folder] = process.argv.slice(2);
assert.equal(urls.length, 13);
assert.equal(new Set(urls).size, 13);
assert.ok(urls.every((url) => url.startsWith(site) && /^[a-z-]+\/$/.test(url.slice(site.length))));
assert.ok(['0', '1'].includes(batch));
const selected = urls.filter((_, index) => index % 2 === Number(batch));

if (mode === 'list') {
  console.log(selected.join('\n'));
} else if (mode === 'collect') {
  const rows = selected.map((url) => {
    const title = url.slice(site.length, -1);
    const data = JSON.parse(readFileSync(resolve(folder, title + '.json'), 'utf8'));
    assert.equal(data.requestedUrl, url);
    assert.equal(data.finalDisplayedUrl ?? data.finalUrl, url);
    assert.equal(data.configSettings.formFactor, 'mobile');
    assert.ok(!data.runtimeError, JSON.stringify(data.runtimeError));
    const flags = data.categories.accessibility.auditRefs.concat(data.categories.seo.auditRefs)
      .filter(({ id, weight }) => weight > 0 && data.audits[id].score !== null && data.audits[id].score < 1)
      .map(({ id }) => id);
    return {
      page: title,
      version: data.lighthouseVersion,
      performance: Math.round(100 * data.categories.performance.score),
      accessibility: Math.round(100 * data.categories.accessibility.score),
      seo: Math.round(100 * data.categories.seo.score),
      cls: +data.audits['cumulative-layout-shift'].numericValue.toFixed(3),
      flags,
    };
  });
  console.log('NEW_GUIDE_MOBILE_RECEIPT ' + JSON.stringify({ batch, rows }));
} else {
  throw new Error('Use list or collect.');
}
