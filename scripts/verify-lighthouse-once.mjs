import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const site = 'https://itsmeb-lab.github.io/wilke-public-labs/';
const slugs = ['index', 'guide-finder', 'milwaukee-cleanout-floor-handoff', 'library-memory-labs', 'library-state-park-passes'];
const reports = slugs.map((slug) => {
  const report = JSON.parse(readFileSync(resolve(process.argv[2], slug + '.json'), 'utf8'));
  const url = site + (slug === 'index' ? '' : slug + '/');
  assert.equal(report.requestedUrl, url);
  assert.equal(report.finalDisplayedUrl ?? report.finalUrl, url);
  assert.equal(report.configSettings.formFactor, 'mobile');
  assert.ok(!report.runtimeError, JSON.stringify(report.runtimeError));
  return {
    url,
    version: report.lighthouseVersion,
    performance: Math.round(report.categories.performance.score * 100),
    accessibility: Math.round(report.categories.accessibility.score * 100),
    seo: Math.round(report.categories.seo.score * 100),
    lcp: Math.round(report.audits['largest-contentful-paint'].numericValue),
    cls: +report.audits['cumulative-layout-shift'].numericValue.toFixed(3),
    tbt: Math.round(report.audits['total-blocking-time'].numericValue),
    failedAccessibilityAndSeo: [...report.categories.accessibility.auditRefs, ...report.categories.seo.auditRefs]
      .filter(({ id, weight }) => weight > 0 && report.audits[id].score !== null && report.audits[id].score < 1)
      .map(({ id }) => id),
  };
});
assert.ok(!reports[0].failedAccessibilityAndSeo.includes('color-contrast'), 'Home contrast still flagged');
assert.ok(reports[1].cls <= .01, 'Guide finder still shifts during startup');
assert.ok(reports[1].accessibility === 100, 'Guide finder accessibility score dropped');
console.log('LIGHTHOUSE_RELEASE_RECEIPT ' + JSON.stringify({ reports, at: new Date().toISOString() }));
