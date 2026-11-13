import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, it } from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const origin = 'https://itsmeb-lab.github.io/wilke-public-labs/';
const pages = [
  ['index.html', '', 'lab_index'],
  ['automation-reliability-lab/index.html', 'automation-reliability-lab/', 'automation_lab'],
  ['windows-process-recovery-watchdog/index.html', 'windows-process-recovery-watchdog/', 'windows_lab'],
];
const decode = (value) => value.replaceAll('&amp;', '&');

for (const [file, slug, content] of pages) {
  describe(`public page: ${file}`, () => {
    const html = readFileSync(path.join(root, file), 'utf8');
    it('has one absolute canonical without campaign parameters', () => {
      const links = [...html.matchAll(/<link rel="canonical" href="([^"]+)">/g)];
      assert.equal(links.length, 1);
      assert.equal(links[0][1], origin + slug);
      assert.doesNotMatch(links[0][1], /\?/);
    });
    it('has one title, description and consistent social URL', () => {
      assert.equal([...html.matchAll(/<title>.+?<\/title>/g)].length, 1);
      assert.equal([...html.matchAll(/<meta name="description" content="[^"]+">/g)].length, 1);
      assert.ok(html.includes(`<meta property="og:url" content="${origin + slug}">`));
      const image = html.match(/<meta property="og:image" content="([^"]+)">/)[1];
      assert.ok(image.startsWith(origin));
      assert.ok(existsSync(path.join(root, image.slice(origin.length))));
    });
    it('links to the defined offer with only non-personal campaign labels', () => {
      const links = [...html.matchAll(/data-diagnostic-link href="([^"]+)"/g)];
      assert.ok(links.length >= 1);
      for (const [, href] of links) {
        const url = new URL(decode(href));
        assert.equal(url.origin, 'https://wilkeservices.com');
        assert.equal(url.pathname, '/software-diagnostic');
        assert.equal(url.searchParams.get('utm_source'), 'wilke_public_labs');
        assert.equal(url.searchParams.get('utm_medium'), 'referral');
        assert.equal(url.searchParams.get('utm_campaign'), 'software_diagnostic');
        assert.equal(url.searchParams.get('utm_content'), content);
        assert.equal(url.searchParams.size, 4);
      }
    });
    it('preserves diagnosis, marketplace and sandbox boundaries', () => {
      assert.match(html, /\$150 USD, one time/);
      assert.match(html, /Implementation is separate/);
      assert.match(html, /not paid-client results/);
      assert.match(html, /pre-contract discussion and payment in your Upwork conversation/);
      assert.match(html, /fictional sample handoff/);
      assert.doesNotMatch(html, /square\.link|checkout\.square|mailto:|<form\b|noindex/i);
      assert.doesNotMatch(html, /C:\\Users|C:\\dev|sk-proj-|github_pat_/);
    });
    it('uses existing local assets and an accessible contact section', () => {
      assert.equal([...html.matchAll(/id="diagnostic-title"/g)].length, 1);
      assert.match(html, /aria-labelledby="diagnostic-title"/);
      const css = html.match(/<link rel="stylesheet" href="([^"]*lab-site\.css)">/)[1];
      assert.ok(existsSync(path.resolve(root, path.dirname(file), css)));
      assert.ok(html.includes('rel="sitemap"'));
    });
  });
}

describe('publication inventory', () => {
  it('lists precisely the three published canonical URLs, without tracking parameters', () => {
    const xml = readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
    assert.match(xml, /xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    assert.deepEqual(urls.sort(), pages.map(([, slug]) => origin + slug).sort());
    assert.doesNotMatch(xml, /utm_|localhost|\/admin|\/login/);
  });
  it('does not broaden the offer into Windows administration', () => {
    const html = readFileSync(path.join(root, 'windows-process-recovery-watchdog/index.html'), 'utf8');
    assert.match(html, /Windows setup, machine administration and process-recovery implementation are not included/);
  });
  it('aligns repository contact information with the live offer without an unverified profile URL', () => {
    const text = readFileSync(path.join(root, 'README.md'), 'utf8');
    assert.match(text, /https:\/\/wilkeservices\.com\/software-diagnostic/);
    assert.match(text, /utm_source=wilke_public_labs/);
    assert.doesNotMatch(text, /~019f8d1b56a7ac81d6|\[View services\]/);
    assert.match(text, /do not prove search indexing, visitors or conversions/);
  });
});

describe('receipt rendering boundary', () => {
  it('renders visitor-controlled receipt values as text, not HTML', () => {
    const source = readFileSync(path.join(root, 'automation-reliability-lab/app.js'), 'utf8');
    assert.doesNotMatch(source, /\.innerHTML\s*=|insertAdjacentHTML\s*\(|document\.write\s*\(/);
    assert.match(source, /cell\.textContent\s*=\s*String\(value\s*\?\?\s*""\)/);
    assert.match(source, /refs\.receiptBody\.replaceChildren\(rows\)/);
  });
});
