import { ENDPOINT, KEY, KEY_LOCATION, REPOSITORY, SITE } from './submit-once.mjs';
import { checkServed } from '../scripts/review-comparisons.mjs';

export function createGuideNotice({ MANIFEST, SUBMISSION_ID, EXPIRES, paths }) {
  const URLS = Object.freeze(paths.map((path) => SITE + path));
  function requireValid(manifest, context, time) {
    if (!Number.isFinite(time) || time >= Date.parse(EXPIRES)) throw new Error('Guide release notification expired.');
    if (context.repository !== REPOSITORY || context.event !== 'push' ||
        context.ref !== 'refs/heads/main' || context.attempt !== '1') {
      throw new Error('Expected the first push run on the canonical repository.');
    }
    if (!Array.isArray(context.changes) || context.changes.length !== 1 || context.changes[0] !== 'A\t' + MANIFEST) {
      throw new Error('Expected the add-only guide notification manifest.');
    }
    if (!manifest || Object.keys(manifest).sort().join(',') !== 'expiresAt,id,urls' ||
        manifest.id !== SUBMISSION_ID || manifest.expiresAt !== EXPIRES ||
        !Array.isArray(manifest.urls) || manifest.urls.length !== URLS.length ||
        !manifest.urls.every((url, index) => url === URLS[index])) {
      throw new Error('Guide notification manifest differs from the reviewed canonical URLs.');
    }
  }

  async function notifyGuideRelease(manifest, context, { fetcher = fetch, now = Date.now, verify = checkServed } = {}) {
    requireValid(manifest, context, now());
    const live = await verify((url, options) => fetcher(url, { ...options, signal: AbortSignal.timeout(12000) }));
    if (!URLS.every((url) => live.some((receipt) => receipt.url === url && receipt.status === 200))) {
      throw new Error('The exact live guide batch could not be confirmed.');
    }
    const key = await fetcher(KEY_LOCATION, { redirect: 'error', signal: AbortSignal.timeout(12000) });
    if (key.url !== KEY_LOCATION || key.status !== 200 || (await key.text()) !== KEY) {
      throw new Error('The project ownership file did not match.');
    }
    requireValid(manifest, context, now());
    const evidence = {
      id: SUBMISSION_ID, checkedUrls: live.length, guides: [...URLS], postAttempted: true,
      automaticRetries: 0, indexingVerified: false,
    };
    try {
      const response = await fetcher(ENDPOINT, {
        method: 'POST',
        redirect: 'error',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ host: new URL(SITE).hostname, key: KEY, keyLocation: KEY_LOCATION, urlList: URLS }),
        signal: AbortSignal.timeout(12000),
      });
      if (!Number.isInteger(response?.status) || response.status < 100 || response.status > 599) throw new Error('Invalid response');
      return { ...evidence, httpStatus: response.status, submittedAt: new Date(now()).toISOString() };
    } catch {
      return { ...evidence, httpStatus: null, submittedAt: new Date(now()).toISOString(), outcome: 'unknown' };
    }
  }

  return { MANIFEST, SUBMISSION_ID, EXPIRES, URLS, notifyGuideRelease };
}

export const { MANIFEST, SUBMISSION_ID, EXPIRES, URLS, notifyGuideRelease } = createGuideNotice({
  MANIFEST: 'ops-indexnow/guide-expansion-20261126.json',
  SUBMISSION_ID: 'guide-expansion-20261126',
  EXPIRES: '2026-11-26T06:09:00.000Z',
  paths: [
    'library-seed-borrowing/',
    'tool-library-borrowing/',
    'milwaukee-cleanout-floor-handoff/',
    'library-sensory-spaces/',
    'eyeglass-donation-rules/',
    'guide-finder/',
    'milwaukee-articulos-voluminosos/',
    'comparison-data/',
  ],
});
