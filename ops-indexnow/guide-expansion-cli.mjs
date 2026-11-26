import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { MANIFEST, notifyGuideRelease } from './guide-expansion.mjs';

const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
const before = event.before;
const head = process.env.GITHUB_SHA;
if (![before, head].every((sha) => typeof sha === 'string' && /^[a-f0-9]{40}$/.test(sha) && !/^0+$/.test(sha)) ||
    before === head) throw new Error('Expected distinct exact commit IDs.');
const changes = execFileSync('git', ['diff', '--name-status', before, head], { encoding: 'utf8', timeout: 5000 }).trim().split(/\r?\n/);
try {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const result = await notifyGuideRelease(manifest, {
    repository: process.env.GITHUB_REPOSITORY,
    event: process.env.GITHUB_EVENT_NAME,
    ref: process.env.GITHUB_REF,
    attempt: process.env.GITHUB_RUN_ATTEMPT,
    changes,
  });
  console.log('GUIDE_EXPANSION_INDEXNOW_RECEIPT ' + JSON.stringify({ release: head, ...result }));
  if (![200, 202].includes(result.httpStatus)) process.exitCode = 1;
} catch (error) {
  console.error('GUIDE_EXPANSION_INDEXNOW_BLOCKED ' + error.message);
  process.exitCode = 1;
}
