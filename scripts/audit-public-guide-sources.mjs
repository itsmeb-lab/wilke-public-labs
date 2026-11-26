import { readFile } from 'node:fs/promises';
import { comparisonGuides } from './review-comparisons.mjs';

const root = new URL('../', import.meta.url);
const files = comparisonGuides.map(({slug}) => slug + '/catalog.json');
const sourceDocs = await Promise.all(files.map(async (file) => ({
  file, body: JSON.parse(await readFile(new URL(file, root), 'utf8')),
})));
const sources = new Map();
for (const {file, body} of sourceDocs) {
  for (const {url} of Object.values(body.sources)) {
    const link = new URL(url);
    if (link.protocol !== 'https:' || link.port || link.username || link.password) continue;
    link.hash = '';
    if (!sources.has(link.href)) sources.set(link.href, []);
    sources.get(link.href).push(file.split('/')[0]);
  }
}

const allowedHosts = new Set([...sources.keys()].map((href) => new URL(href).hostname.replace(/^www\./, '')));
const active = new Set();
const delay = (ms) => new Promise((done) => setTimeout(done, ms));

async function request(url, method) {
  const response = await fetch(url, {
    method, redirect: 'manual', signal: AbortSignal.timeout(6500),
    headers: { 'User-Agent': 'WilkePublicLabs-SourceReview/1.0', ...(method === 'GET' ? { Range: 'bytes=0-4095' } : {}) },
  });
  await response.body?.cancel();
  return {http: response.status, location: response.headers.get('location')};
}

async function audit(href) {
  const original = new URL(href);
  let url = original;
  const chain = [];
  try {
    for (let hop = 0; hop < 4; hop++) {
      let {http, location} = await request(url, 'HEAD');
      if ([400, 403, 404, 405, 410, 501].includes(http)) ({http, location} = await request(url, 'GET'));
      if ([301, 302, 303, 307, 308].includes(http) && location) {
        const next = new URL(location, url);
        if (next.protocol !== 'https:' || next.username || next.password || next.port ||
            !allowedHosts.has(next.hostname.replace(/^www\./, ''))) {
          return {status:'redirect-review', http, chain, final:next.href};
        }
        chain.push(url.href);
        url = next;
        continue;
      }
      const status = http >= 200 && http < 300 ? (chain.length ? 'moved' : 'reachable') :
        [404, 410].includes(http) ? 'missing-review' : 'access-review';
      return {status, http, chain, final:url.href};
    }
    return {status:'redirect-review', chain, final:url.href};
  } catch (error) {
    return {status:'access-review', chain, final:url.href, error:error.cause?.code ?? error.name};
  }
}

const pending = [...sources.keys()];
const rows = [];
await Promise.all(Array.from({length:6}, async () => {
  while (pending.length) {
    const idx = pending.findIndex((href) => !active.has(new URL(href).hostname.replace(/^www\./,'')));
    if (idx === -1) { await delay(150); continue; }
    const href = pending.splice(idx,1)[0];
    const host = new URL(href).hostname.replace(/^www\./,'');
    active.add(host);
    const result = await audit(href);
    rows.push({href, guides:sources.get(href), ...result});
    await delay(450);
    active.delete(host);
  }
}));
const counts = Object.create(null);
for (const row of rows) counts[row.status] = (counts[row.status] ?? 0) + 1;
console.log(JSON.stringify({sources:sources.size, counts}));
for (const row of rows.sort((a,b)=>a.href.localeCompare(b.href))) {
  if (row.status !== 'reachable') console.log('SOURCE ' + JSON.stringify(row));
}
