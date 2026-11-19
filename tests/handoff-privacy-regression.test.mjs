import test from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm, stat, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateReportInput, writeHandoffPackage } from '../diagnostic-case-lab/handoff-builder.mjs';

const repo = resolve(fileURLToPath(new URL('..', import.meta.url)));
const raw = JSON.parse(await readFile(new URL('../diagnostic-case-lab/fixtures/synthetic-false-success.json', import.meta.url), 'utf8'));
const css = await readFile(new URL('../diagnostic-case-lab/handoff-print.css', import.meta.url), 'utf8');
const variants = [
  ['project-style key', 'sk-proj-' + 'SYNTHETICNOTACREDENTIAL'.repeat(2)],
  ['OAuth-shaped token', 'gho_' + 'SYNTHETICNOTACREDENTIAL'.repeat(2)],
  ['installation-shaped token', 'ghs_' + 'SYNTHETICNOTACREDENTIAL'.repeat(2)],
  ['app-shaped token', 'xapp-' + 'synthetic-not-a-credential'.repeat(2)],
  ['restricted test-shaped token', 'rk_test_' + 'SYNTHETICNOTACREDENTIAL'.repeat(2)],
];
const place = [
  r => [r, 'actual'],
  r => [r.analysis, 'finding'],
  r => [r.evidence[0], 'summary'],
  r => [r.acceptanceTests, 0],
];
for (const [name, specimen] of variants) {
  test('rejects invented ' + name + ' across report text fields', () => {
    for (const locate of place) {
      const r = structuredClone(raw);
      const [parent, key] = locate(r);
      parent[key] = 'Synthetic privacy fixture: ' + specimen;
      assert.throws(() => validateReportInput(r), /redact before generating/);
    }
  });
}
test('ordinary technical prose and redacted placeholders remain usable', () => {
  for (const text of [
    'OpenAI project authentication was reviewed with all credential values redacted.',
    'The GitHub OAuth integration uses an installation credential stored by its owner.',
    'The xapp configuration failed; the restricted Stripe key was never copied.',
    '[REDACTED] token; request identifier SYN-REQUEST-ONE; no customer identifier.',
  ]) {
    const r = structuredClone(raw);
    r.analysis.finding = text;
    assert.equal(validateReportInput(r).analysis.finding, text);
  }
});
test('rejected credential-shaped input creates no private package or files', async () => {
  const scratch = await mkdtemp(join(tmpdir(), 'atlas-l04-secret-fixture-'));
  const target = join(scratch, 'must-not-exist');
  try {
    const r = structuredClone(raw);
    r.actual = variants[0][1];
    await assert.rejects(writeHandoffPackage(r, target, { css }), /redact before generating/);
    await assert.rejects(access(target), error => error.code === 'ENOENT');
  } finally { await rm(scratch, { recursive: true, force: true }); }
});
test('a repository child beginning with two dots is still inside the repository', async () => {
  const target = join(repo, '..private-regression-' + process.pid);
  try {
    await assert.rejects(writeHandoffPackage(structuredClone(raw), target, { css }),
      /outside the public Git repository/);
    await assert.rejects(access(target), error => error.code === 'ENOENT');
  } finally { await rm(target, { recursive: true, force: true }); }
});
test('an external directory link into the repository cannot receive private reports', async () => {
  const scratch = await mkdtemp(join(tmpdir(), 'atlas-l04-link-fixture-'));
  const link = join(scratch, 'public-alias');
  const child = 'linked-private-regression-' + process.pid;
  try {
    await symlink(repo, link, process.platform === 'win32' ? 'junction' : 'dir');
    await assert.rejects(writeHandoffPackage(structuredClone(raw), join(link, child), { css }),
      /outside the public Git repository/);
    await assert.rejects(access(join(repo, child)), error => error.code === 'ENOENT');
  } finally {
    await rm(join(repo, child), { recursive: true, force: true });
    await rm(scratch, { recursive: true, force: true });
  }
});
test('an ordinary new private sibling directory remains writable', async () => {
  const scratch = await mkdtemp(join(tmpdir(), 'atlas-l04-good-fixture-'));
  try {
    const target = join(scratch, 'private-report');
    const result = await writeHandoffPackage(structuredClone(raw), target, { css });
    assert.equal(result.target, target);
    assert.equal(result.manifest.publicRelease, false);
    assert.equal(result.manifest.deliveredToCustomer, false);
    assert.equal((await stat(join(target, 'report.html'))).isFile(), true);
  } finally { await rm(scratch, { recursive: true, force: true }); }
});
test('external-to-external alias resolves to a safe canonical destination', async () => {
  const scratch = await mkdtemp(join(tmpdir(), 'atlas-l04-safe-link-'));
  const external = await mkdtemp(join(tmpdir(), 'atlas-l04-real-private-'));
  try {
    const alias = join(scratch, 'private-alias');
    await symlink(external, alias, process.platform === 'win32' ? 'junction' : 'dir');
    const result = await writeHandoffPackage(structuredClone(raw), join(alias, 'handoff'), { css });
    assert.equal(result.manifest.publicRelease, false);
    assert.equal((await stat(join(external, 'handoff', 'manifest.json'))).isFile(), true);
  } finally {
    await rm(scratch, { recursive: true, force: true });
    await rm(external, { recursive: true, force: true });
  }
});

