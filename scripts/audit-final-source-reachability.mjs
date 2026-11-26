import { setTimeout as delay } from 'node:timers/promises';
import { sourcesReviewedBefore } from './review-comparisons.mjs';

const startedAt = new Date().toISOString();
const sources = sourcesReviewedBefore('2100-12-31').filter(({ checkedOn }) => checkedOn >= '2026-11-26');
const entries = new Map();
for (const source of sources) {
  const url = new URL(source.url);
  if (url.protocol !== 'https:' || url.username || url.password || url.port) throw new Error('Unexpected operator link');
  url.hash = '';
  const href = url.href;
  if (!entries.has(href)) entries.set(href, { url: href, host: url.hostname, guides: [] });
  entries.get(href).guides.push(new URL(source.page).pathname.split('/').filter(Boolean).at(-1));
}
if (entries.size < 10 || entries.size > 40) throw new Error('The reviewed source set is outside this audit’s expected scope.');
const pauseUntil = new Map();
const rows = [];
for (const [index, entry] of [...entries.values()].entries()) {
  if (Date.now() >= Date.parse('2026-11-26T06:12:00Z')) throw new Error('This one-time review window ended.');
  if (index) await delay(12000);
  if (pauseUntil.has(entry.host)) {
    rows.push({ ...entry, outcome: 'skipped_host_rate_limit', status: null });
    continue;
  }
  try {
    const response = await fetch(entry.url, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(7800) });
    const loc = response.headers.get('location');
    const redirected = loc ? new URL(loc, entry.url) : null;
    const status = response.status;
    if (status === 429) pauseUntil.set(entry.host, true);
    rows.push({
      ...entry,
      status,
      outcome: status === 200 ? 'headers_ok' : status >= 300 && status < 400 ? 'redirect_observed' : 'status_requires_review',
      redirect: redirected ? redirected.origin + redirected.pathname : null,
      type: response.headers.get('content-type')?.split(';')[0] ?? null,
    });
  } catch (error) {
    rows.push({ ...entry, status: null, outcome: error.name === 'TimeoutError' ? 'timeout' : 'transport_unavailable' });
  }
  console.log('SOURCE_PROGRESS ' + (index + 1) + '/' + entries.size);
}
const summary = Object.fromEntries([...new Set(rows.map(({ outcome }) => outcome))].map((outcome) =>
  [outcome, rows.filter((row) => row.outcome === outcome).length]));
console.log('SOURCE_AUDIT ' + JSON.stringify({ startedAt, endedAt: new Date().toISOString(), checkedCount: entries.size, summary, rows }));
