import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
for (const name of ['index', 'guide-finder']) {
  const report = JSON.parse(readFileSync(resolve(process.argv[2], name + '.json'), 'utf8'));
  const audits = Object.fromEntries(['color-contrast', 'cumulative-layout-shift', 'layout-shifts', 'cls-culprits-insight']
    .filter((id) => report.audits[id])
    .map((id) => [id, { score: report.audits[id].score, details: report.audits[id].details }]));
  console.log('MOBILE_DETAIL ' + JSON.stringify({ name, audits }));
}
