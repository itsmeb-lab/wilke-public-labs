import { createGuideNotice } from './guide-expansion.mjs';

export const { MANIFEST, SUBMISSION_ID, EXPIRES, URLS, notifyGuideRelease } = createGuideNotice({
  MANIFEST: 'ops-indexnow/guide-followup-20261126.json',
  SUBMISSION_ID: 'guide-followup-20261126',
  EXPIRES: '2026-11-26T06:13:00.000Z',
  paths: [
    'library-instrument-borrowing/',
    'used-bicycle-donations/',
    'library-memory-labs/',
    'household-document-shredding/',
    'library-state-park-passes/',
  ],
});
