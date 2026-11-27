import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, rmdir, stat, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditClaims, renderReportHtml, resolvePrivateHandoffPath, validateReportInput, writeHandoffPackage } from '../diagnostic-case-lab/handoff-builder.mjs';

const repo = resolve(fileURLToPath(new URL('..', import.meta.url)));
const raw = JSON.parse(await readFile(new URL('../diagnostic-case-lab/fixtures/synthetic-false-success.json', import.meta.url), 'utf8'));
const css = await readFile(new URL('../diagnostic-case-lab/handoff-print.css', import.meta.url), 'utf8');
const clone = () => structuredClone(raw);
const input = () => validateReportInput(clone());
const audit = () => auditClaims(input());
const render = (record = input()) => renderReportHtml(record, auditClaims(record), css, '2026-11-17T12:00:00.000Z');

test('synthetic report is complete but never implies a real client or payment', () => {
  const r = input();
  assert.equal(r.reference, 'SYN-API-001');
  assert.equal(r.classification, 'synthetic');
  assert.deepEqual(r.evidence.map(e => e.stage), ['transport', 'application', 'persistence', 'ui', 'recipient']);
  assert.equal(audit().confirmedContradiction, true);
  assert.equal(audit().verifiedSave, false);
  assert.equal(audit().recipientVerified, false);
  assert.equal(audit().verdict, 'CONTRADICTED SUCCESS CLAIM');
});

test('report is accessible, printable, offline HTML with explicit boundaries', () => {
  const html = render();
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<main id="main">/);
  assert.match(html, /<h1>/);
  assert.match(html, /<caption>/);
  assert.match(html, /data-label="Observation"/);
  assert.match(html, /<span class="state">not tested<\/span>/);
  assert.doesNotMatch(html, /<span class="state">not_tested<\/span>/);
  assert.match(css, /tbody td::before \{ content: attr\(data-label\)/);
  assert.match(css, /caption \{ position: absolute; display: block;/);
  assert.match(html, /scope="col"/);
  assert.match(html, /SYNTHETIC TEACHING REPORT · NOT A CLIENT CASE/);
  assert.match(html, /NOT SENT — no delivery receipt/);
  assert.match(html, /UNVERIFIED — no settlement evidence/);
  assert.match(html, /@media print/);
  assert.match(html, /Content-Security-Policy/);
  assert.doesNotMatch(html, /<(?:script|form|iframe|input)\b/i);
  assert.doesNotMatch(html, /https?:\/\//i);
});

test('untrusted text stays inert in the resulting HTML', () => {
  const r = clone();
  r.question = '<img src=x onerror=alert(1)> & a single issue';
  const html = render(validateReportInput(r));
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt; &amp; a single issue/);
  assert.doesNotMatch(html, /<img\b/i);
});

test('privacy screening blocks direct emails, credentials, and raw key assignments', () => {
  for (const suspicious of ['person@example.org', 'sk_live_fake-but-secret', 'password=unsafeValue']) {
    const r = clone();
    r.actual = `Observed text: ${suspicious}`;
    assert.throws(() => validateReportInput(r), /redact before generating/);
  }
});

test('extra fields and invalid scope types are rejected instead of silently copied', () => {
  const r = clone();
  r.payment = { status: 'paid' };
  assert.throws(() => validateReportInput(r), /not permitted/);
  delete r.payment;
  r.issueType = 'broad-architecture-audit';
  assert.throws(() => validateReportInput(r), /issueType must be/);
});

test('missing, duplicate or uncited stages do not produce a confident report', () => {
  const r = clone();
  r.evidence = r.evidence.filter(e => e.stage !== 'persistence');
  assert.throws(() => validateReportInput(r), /persistence fact must cite/);
  const duplicate = clone();
  duplicate.evidence.push({ ...duplicate.evidence[0] });
  assert.throws(() => validateReportInput(duplicate), /stages must be unique/);
  const mismatch = clone();
  mismatch.facts.application.evidenceRef = 'SYN-WRONG';
  assert.throws(() => validateReportInput(mismatch), /application fact must cite/);
});

test('a saved record must have its own reference', () => {
  const r = clone();
  r.facts.persistence.result = 'saved';
  assert.throws(() => validateReportInput(r), /saved record needs a saved reference/i);
});

test('claim audit does not promote HTTP 200 into saved or delivered', () => {
  const r = clone();
  r.facts.persistence.result = 'unknown';
  r.facts.application.result = 'unknown';
  const summary = auditClaims(validateReportInput(r));
  assert.equal(summary.transportAccepted, true);
  assert.equal(summary.unverifiedSuccess, true);
  assert.equal(summary.confirmedContradiction, false);
  assert.equal(summary.verifiedSave, false);
  assert.equal(summary.recipientVerified, false);
});

test('even a proven saved record does not prove recipient delivery', () => {
  const r = clone();
  r.facts.application.result = 'accepted';
  r.facts.persistence.result = 'saved';
  r.facts.persistence.savedReference = 'SYN-SAVED-ONE';
  const result = auditClaims(validateReportInput(r));
  assert.equal(result.verifiedSave, true);
  assert.equal(result.recipientVerified, false);
});

test('reported-only save evidence cannot certify a saved record or happy-path completion', () => {
  const r = clone();
  r.facts.application.result = 'accepted';
  r.facts.persistence.result = 'saved';
  r.facts.persistence.savedReference = 'SYN-SAVED-ONE';
  r.evidence.find(e => e.stage === 'persistence').state = 'reported';
  const result = auditClaims(validateReportInput(r));
  assert.equal(result.verifiedSave, false);
  assert.equal(result.unverifiedSuccess, true);
  assert.equal(result.verdict, 'UNVERIFIED SUCCESS CLAIM');
  assert.match(renderReportHtml(validateReportInput(r), result, css, '2026-11-17T12:00:00.000Z'),
    /UNVERIFIED SUCCESS CLAIM/);
});

test('reported-only rejection cannot certify a contradiction', () => {
  const r = clone();
  r.evidence.find(e => e.stage === 'application').state = 'reported';
  r.evidence.find(e => e.stage === 'persistence').state = 'reported';
  const result = auditClaims(validateReportInput(r));
  assert.equal(result.confirmedContradiction, false);
  assert.equal(result.unverifiedSuccess, true);
  assert.equal(result.verdict, 'UNVERIFIED SUCCESS CLAIM');
  const html = renderReportHtml(validateReportInput(r), result, css, '2026-11-17T12:00:00.000Z');
  assert.equal(html.includes('Provisional findings — verify sources before treating these claims as facts'), true);
  assert.equal(html.includes('Provisional finding (unverified)'), true);
});

test('a secondhand UI claim is never a directly observed contradiction', () => {
  const r = clone();
  r.evidence.find(e => e.stage === 'ui').state = 'reported';
  const result = auditClaims(validateReportInput(r));
  assert.equal(result.confirmedContradiction, false);
  assert.equal(result.verdict, 'UNVERIFIED SUCCESS CLAIM');
});

test('customer-facing summary marks reported-only HTTP and application values as unconfirmed', () => {
  const r = clone();
  r.evidence.find(e => e.stage === 'transport').state = 'reported';
  r.evidence.find(e => e.stage === 'application').state = 'reported';
  const record = validateReportInput(r);
  const html = renderReportHtml(record, auditClaims(record), css, '2026-11-17T12:00:00.000Z');
  assert.match(html, /<span>HTTP<\/span><strong>200 \(reported, not observed\)<\/strong>/);
  assert.match(html, /<span>Application<\/span><strong>rejected \(reported, not observed\)<\/strong>/);
  assert.equal(auditClaims(record).transportAccepted, false);
});

test('untested or unknown evidence cannot carry a concrete asserted result', () => {
  for (const [stage, state] of [['persistence', 'not_tested'], ['application', 'unknown'], ['ui', 'not_tested'],
    ['transport', 'unknown']]) {
    const r = clone();
    r.evidence.find(e => e.stage === stage).state = state;
    assert.throws(() => validateReportInput(r), /concrete outcome|not observed/i, stage);
  }
});

test('verified recipient status without a separate observed receipt fails closed', () => {
  const r = clone();
  r.facts.recipient.result = 'verified';
  assert.throws(() => validateReportInput(r), /Recipient verification needs an actual receipt/);
  r.facts.recipient.receiptRef = 'SYN-R001';
  assert.throws(() => validateReportInput(r), /verified delivery needs its own observed receipt/);
});

test('recipient receipt status remains an operator claim, not external verification', () => {
  const r = clone();
  r.facts.recipient.result = 'verified';
  r.facts.recipient.receiptRef = 'SYN-R001';
  r.evidence.find(e => e.stage === 'recipient').state = 'observed';
  const result = auditClaims(validateReportInput(r));
  assert.equal(result.recipientVerified, true);
  assert.match(result.warning, /cannot authenticate source systems/);
});

test('writes exact-hash HTML + manifest + checklist to a fresh private directory only', async () => {
  const scratch = await mkdtemp(join(tmpdir(), 'atlas-l04-unique-'));
  try {
    const destination = join(scratch, 'handoff-a');
    const result = await writeHandoffPackage(clone(), destination,
      { css, preparedAt: '2026-11-17T12:00:00.000Z' });
    assert.deepEqual(result.outputFiles, ['report.html', 'manifest.json', 'delivery-checklist.md']);
    const html = await readFile(join(destination, 'report.html'), 'utf8');
    const manifest = JSON.parse(await readFile(join(destination, 'manifest.json'), 'utf8'));
    const checklist = await readFile(join(destination, 'delivery-checklist.md'), 'utf8');
    assert.equal(manifest.reportHtmlSha256, createHash('sha256').update(html).digest('hex').toUpperCase());
    assert.equal(manifest.deliveredToCustomer, false);
    assert.equal(manifest.customerAcceptanceRecorded, false);
    assert.equal(manifest.paymentVerified, false);
    assert.equal(manifest.independentSourceVerification, false);
    assert.match(checklist, /Obtain internal review/);
    await assert.rejects(writeHandoffPackage(clone(), destination, { css }), /EEXIST/);
    assert.equal((await stat(join(destination, 'report.html'))).size > 1000, true);
  } finally { await rm(scratch, { recursive: true, force: true }); }
});

test('Chrome report verifier refuses private artifacts inside public repository before launching a browser', () => {
  const verifier = fileURLToPath(new URL('../diagnostic-case-lab/verify-handoff-browser.mjs', import.meta.url));
  assert.throws(() => execFileSync(process.execPath, [verifier, '--report', join(repo, 'README.md'),
    '--out-dir', join(repo, 'never-write-private-report')], { encoding: 'utf8', stdio: 'pipe' }),
    error => /outside the public Git repository/.test(String(error.stderr)));
});

test('refuses accidental output into the public Git repository', async () => {
  await assert.rejects(writeHandoffPackage(clone(), join(repo, 'public-evidence-should-not-exist'), { css }),
    /outside the public Git repository/);
});

async function clearSyntheticHandoff(directory) {
  for (const name of ['report.html', 'manifest.json', 'delivery-checklist.md']) {
    await rm(join(directory, name), { force: true });
  }
  try { await rmdir(directory); } catch (error) { if (error.code !== 'ENOENT') throw error; }
}

test('a dot-prefixed directory name cannot pass as a parent traversal', async () => {
  const destination = join(repo, '..synthetic-private-' + randomUUID());
  try {
    await assert.rejects(writeHandoffPackage(clone(), destination, { css }), /outside the public Git repository/);
  } finally {
    await clearSyntheticHandoff(destination);
  }
});

test('a private-looking alias into the public checkout is refused for reads and writes', async () => {
  const scratch = await mkdtemp(join(tmpdir(), 'atlas-l04-alias-'));
  const alias = join(scratch, 'synthetic-checkout-alias');
  const name = 'synthetic-private-' + randomUUID();
  try {
    await symlink(repo, alias, process.platform === 'win32' ? 'junction' : 'dir');
    await assert.rejects(writeHandoffPackage(clone(), join(alias, name), { css }), /outside the public Git repository/);
    await assert.rejects(resolvePrivateHandoffPath(join(alias, 'README.md')), /outside the public Git repository/);
    await assert.rejects(resolvePrivateHandoffPath(join(alias, name, 'nested')), /outside the public Git repository/);
    await assert.rejects(stat(join(repo, name)), { code: 'ENOENT' });
  } finally {
    await clearSyntheticHandoff(join(repo, name));
    await rm(alias, { force: true });
    await rmdir(scratch);
  }
});

test('the actual CLI creates the same truthful, untransmitted package', async () => {
  const scratch = await mkdtemp(join(tmpdir(), 'atlas-l04-cli-'));
  try {
    const destination = join(scratch, 'handoff');
    const cli = fileURLToPath(new URL('../diagnostic-case-lab/build-handoff.mjs', import.meta.url));
    const source = fileURLToPath(new URL('../diagnostic-case-lab/fixtures/synthetic-false-success.json', import.meta.url));
    const stdout = execFileSync(process.execPath, [cli, '--input', source, '--out-dir', destination],
      { encoding: 'utf8' });
    assert.match(stdout, /PRIVATE_DRAFT_CREATED/);
    assert.match(stdout, /"delivered": false/);
    const manifest = JSON.parse(await readFile(join(destination, 'manifest.json'), 'utf8'));
    assert.equal(manifest.audit.verdict, 'CONTRADICTED SUCCESS CLAIM');
    assert.equal(manifest.publicRelease, false);
  } finally { await rm(scratch, { recursive: true, force: true }); }
});
