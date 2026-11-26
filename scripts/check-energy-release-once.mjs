import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = new URL('https://itsmeb-lab.github.io/wilke-public-labs/');
const pages = new Map([
  ['home-energy-tool-lending/', ['id="answer--power-meter--ballarat"', 'iOS 18 or Android 14', 'rel="canonical"']],
  ['home-energy-tool-lending/comparison.csv', ['ballarat:power-meter', 'norfolk:thermal-camera']],
  ['guide-finder/', ['../home-energy-tool-lending/#thermal-camera']],
  ['comparison-data/', ['512 task and program records']],
  ['comparison-data/community-comparisons.json', ['home-energy-tool-lending:ballarat:power-meter']],
  ['guide-updates.xml', ['<guid isPermaLink="true">' + new URL('home-energy-tool-lending/', base).href]],
  ['sitemap.xml', ['<loc>' + new URL('home-energy-tool-lending/', base).href]],
  ['hardwood-finish-return/', ['pallmann-pall-x-gold', 'rel="canonical"']],
  ['estimate-change-calculator/', ['change-tool', 'rel="canonical"']],
]);
const results = await Promise.all([...pages].map(async ([route, markers]) => {
  const url = new URL(route, base);
  const r = await fetch(url, { redirect:'error', signal:AbortSignal.timeout(15000) });
  assert.equal(r.status, 200, route);
  assert.doesNotMatch(r.headers.get('x-robots-tag') ?? '', /noindex/i, route);
  const body = await r.text();
  for (const marker of markers) assert.ok(body.includes(marker), route + ' ' + marker);
  if (markers.includes('rel="canonical"')) assert.ok(body.includes('rel="canonical" href="' + url.href + '"'), route);
  if (route.includes('home-energy-tool-lending')) {
    const file = route.endsWith('/') ? route + 'index.html' : route;
    assert.equal(body.replaceAll('\r\n','\n'), (await readFile(file,'utf8')).replaceAll('\r\n','\n'));
  }
  return {route, status:r.status};
}));
console.log(JSON.stringify({verified:results.length, results}));
