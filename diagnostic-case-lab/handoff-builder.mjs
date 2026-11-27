// Offline-only diagnostic report packaging. No customer messages, checkout, or network I/O.
import { createHash } from 'node:crypto';
import { mkdir, realpath, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SCHEMA = 'wilke-one-issue-report-input-v1';
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = new Set(['node-api', 'webhook', 'lead-form']);
const STAGES = new Set(['trigger', 'transport', 'application', 'persistence', 'ui', 'retry', 'recipient']);
const STATES = new Set(['observed', 'reported', 'not_tested', 'unknown']);
const SENSITIVE = [
  /\b(?:sk_(?:live|test)_|rk_live_|ghp_|github_pat_|xox[baprs]-|AKIA[0-9A-Z]{12})\S*/i,
  /-----BEGIN\s+(?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  /\b(?:password|authorization|api[_ -]?key|access[_ -]?token)\s*[:=]\s*\S+/i,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /\b(?:\d[ -]?){13,19}\b/,
];

function object(value, label, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
  for (const key of Object.keys(value)) if (!keys.includes(key)) throw new Error(`${label}.${key} is not permitted`);
  return value;
}

function string(value, label, max = 600) {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u0008\u000b\u000e-\u001f]/.test(value)) {
    throw new Error(`${label} must be nonempty sanitized text of at most ${max} characters`);
  }
  if (SENSITIVE.some(pattern => pattern.test(value))) throw new Error(`${label} resembles a secret or personal identifier; redact before generating`);
  return value.trim();
}

function choice(value, label, allowed) {
  if (!allowed.includes(value)) throw new Error(`${label} must be ${allowed.join(' / ')}`);
  return value;
}

function reference(value, label) {
  const text = string(value, label, 64);
  if (!/^[A-Z][A-Z0-9-]{3,63}$/.test(text)) throw new Error(`${label} must be a non-identifying uppercase reference`);
  return text;
}

function maybeReference(value, label) { return value === null ? null : reference(value, label); }

export function validateReportInput(raw) {
  object(raw, 'report', ['schema', 'classification', 'reference', 'issueType', 'question', 'expected', 'actual',
    'environment', 'sourceVersion', 'permission', 'reproduction', 'facts', 'evidence', 'analysis',
    'acceptanceTests', 'clarification']);
  if (raw.schema !== SCHEMA) throw new Error(`schema must be ${SCHEMA}`);
  const classification = choice(raw.classification, 'classification', ['synthetic', 'sanitized-private']);
  const record = {
    schema: SCHEMA, classification, reference: reference(raw.reference, 'reference'),
    issueType: choice(raw.issueType, 'issueType', [...TYPES]),
    question: string(raw.question, 'question', 280), expected: string(raw.expected, 'expected', 280),
    actual: string(raw.actual, 'actual', 280), environment: string(raw.environment, 'environment', 180),
    sourceVersion: string(raw.sourceVersion, 'sourceVersion', 100),
    permission: string(raw.permission, 'permission', 220),
    reproduction: string(raw.reproduction, 'reproduction', 480)
  };
  object(raw.facts, 'facts', ['transport', 'application', 'persistence', 'ui', 'recipient']);
  const { transport, application, persistence, ui, recipient } = raw.facts;
  object(transport, 'facts.transport', ['httpStatus', 'evidenceRef']);
  object(application, 'facts.application', ['result', 'evidenceRef']);
  object(persistence, 'facts.persistence', ['result', 'savedReference', 'evidenceRef']);
  object(ui, 'facts.ui', ['result', 'evidenceRef']);
  object(recipient, 'facts.recipient', ['result', 'receiptRef']);
  const status = transport.httpStatus;
  if (status !== null && (!Number.isInteger(status) || status < 100 || status > 599))
    throw new Error('facts.transport.httpStatus must be a valid HTTP status or null');
  record.facts = {
    transport: { httpStatus: status, evidenceRef: reference(transport.evidenceRef, 'facts.transport.evidenceRef') },
    application: { result: choice(application.result, 'application.result', ['accepted', 'rejected', 'unknown']),
      evidenceRef: reference(application.evidenceRef, 'facts.application.evidenceRef') },
    persistence: { result: choice(persistence.result, 'persistence.result', ['saved', 'not_saved', 'unknown']),
      savedReference: maybeReference(persistence.savedReference, 'persistence.savedReference'),
      evidenceRef: reference(persistence.evidenceRef, 'facts.persistence.evidenceRef') },
    ui: { result: choice(ui.result, 'ui.result', ['claimed_success', 'claimed_failure', 'unknown']),
      evidenceRef: reference(ui.evidenceRef, 'facts.ui.evidenceRef') },
    recipient: { result: choice(recipient.result, 'recipient.result', ['verified', 'unknown', 'not_tested']),
      receiptRef: maybeReference(recipient.receiptRef, 'recipient.receiptRef') }
  };
  if ((record.facts.persistence.result === 'saved') !== !!record.facts.persistence.savedReference)
    throw new Error('A saved record needs a saved reference; unknown or unsaved results must not carry one');
  if ((record.facts.recipient.result === 'verified') !== !!record.facts.recipient.receiptRef)
    throw new Error('Recipient verification needs an actual receipt reference; unknown must stay unknown');
  if (!Array.isArray(raw.evidence) || raw.evidence.length < 4 || raw.evidence.length > 12)
    throw new Error('evidence must contain 4–12 separately identified stage observations');
  record.evidence = raw.evidence.map((item, index) => {
    object(item, `evidence[${index}]`, ['stage', 'state', 'summary', 'ref']);
    const stage = choice(item.stage, `evidence[${index}].stage`, [...STAGES]);
    return { stage, state: choice(item.state, `evidence[${index}].state`, [...STATES]),
      summary: string(item.summary, `evidence[${index}].summary`, 340),
      ref: reference(item.ref, `evidence[${index}].ref`) };
  });
  if (new Set(record.evidence.map(e => e.stage)).size !== record.evidence.length)
    throw new Error('evidence stages must be unique');
  for (const [stage, ref] of [['transport', record.facts.transport.evidenceRef],
    ['application', record.facts.application.evidenceRef],
    ['persistence', record.facts.persistence.evidenceRef], ['ui', record.facts.ui.evidenceRef]]) {
    const matched = record.evidence.find(e => e.stage === stage);
    if (!matched || matched.ref !== ref) throw new Error(`${stage} fact must cite its matching evidence stage`);
  }
  const receipt = record.evidence.find(e => e.stage === 'recipient');
  if (!receipt || (record.facts.recipient.result === 'verified' &&
    (receipt.state !== 'observed' || receipt.ref !== record.facts.recipient.receiptRef))) {
    throw new Error('Recipient stage must exist; verified delivery needs its own observed receipt');
  }
  const concreteClaims = [
    ['transport', record.facts.transport.httpStatus !== null],
    ['application', record.facts.application.result !== 'unknown'],
    ['persistence', record.facts.persistence.result !== 'unknown'],
    ['ui', record.facts.ui.result !== 'unknown'],
    ['recipient', record.facts.recipient.result === 'verified']
  ];
  for (const [stage, concrete] of concreteClaims) {
    const stageEvidence = record.evidence.find(e => e.stage === stage);
    if (concrete && (stageEvidence.state === 'not_tested' || stageEvidence.state === 'unknown'))
      throw new Error(`${stage} cannot assert a concrete outcome while its evidence is ${stageEvidence.state}`);
  }
  object(raw.analysis, 'analysis', ['finding', 'likelyCause', 'alternatives', 'unknowns', 'recommendation']);
  record.analysis = Object.fromEntries(['finding', 'likelyCause', 'alternatives', 'unknowns', 'recommendation']
    .map(key => [key, string(raw.analysis[key], `analysis.${key}`, 500)]));
  if (!Array.isArray(raw.acceptanceTests) || raw.acceptanceTests.length < 2 || raw.acceptanceTests.length > 8)
    throw new Error('acceptanceTests requires 2–8 bounded future checks');
  record.acceptanceTests = raw.acceptanceTests.map((value, i) => string(value, `acceptanceTests[${i}]`, 260));
  record.clarification = string(raw.clarification, 'clarification', 280);
  return record;
}

export function auditClaims(record) {
  const { application, persistence, ui, recipient, transport } = record.facts;
  const evidenceByStage = new Map(record.evidence.map(entry => [entry.stage, entry]));
  const observed = stage => evidenceByStage.get(stage)?.state === 'observed';
  const verifiedSave = observed('application') && observed('persistence') &&
    application.result === 'accepted' && persistence.result === 'saved' && !!persistence.savedReference;
  const confirmedContradiction = observed('ui') && ui.result === 'claimed_success' &&
    ((observed('application') && application.result === 'rejected') ||
      (observed('persistence') && persistence.result === 'not_saved'));
  const unverifiedSuccess = ui.result === 'claimed_success' && !verifiedSave && !confirmedContradiction;
  const recipientVerified = observed('recipient') && recipient.result === 'verified' &&
    !!recipient.receiptRef && evidenceByStage.get('recipient').ref === recipient.receiptRef;
  return {
    transportAccepted: observed('transport') && transport.httpStatus !== null &&
      transport.httpStatus >= 200 && transport.httpStatus < 300,
    verifiedSave, recipientVerified, confirmedContradiction, unverifiedSuccess,
    verdict: confirmedContradiction ? 'CONTRADICTED SUCCESS CLAIM' : unverifiedSuccess ? 'UNVERIFIED SUCCESS CLAIM'
      : verifiedSave ? 'SAVED RECORD PROVEN IN SUPPLIED EVIDENCE' : 'NO VERIFIED SAVE',
    warning: 'These checks compare operator-supplied sanitized evidence. Reported or untested stages cannot establish success, contradiction or delivery. The tool cannot authenticate source systems, signatures, recipients or payment.'
  };
}

const escape = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

export function renderReportHtml(record, audit, css, preparedAt) {
  const sample = record.classification === 'synthetic';
  const banner = sample ? 'SYNTHETIC TEACHING REPORT · NOT A CLIENT CASE' : 'PRIVATE DRAFT · NOT DELIVERED';
  const rows = record.evidence.map(e => `<tr><th scope="row">${escape(e.stage)}</th><td data-label="State"><span class="state">${escape(e.state.replaceAll("_", " "))}</span></td><td data-label="Observation">${escape(e.summary)}</td><td data-label="Reference"><code>${escape(e.ref)}</code></td></tr>`).join('\n');
  const checks = record.acceptanceTests.map(item => `<li>${escape(item)}</li>`).join('\n');
  const findingsHeading = audit.unverifiedSuccess
    ? 'Provisional findings — verify sources before treating these claims as facts'
    : 'Findings and decision';
  const findingLabel = audit.unverifiedSuccess ? 'Provisional finding (unverified)' : 'Bounded finding';
  const confidenceNote = audit.unverifiedSuccess
    ? '<p class="confidence-warning" role="note">These statements were supplied by an operator. The evidence stages are not sufficiently observed to confirm the claimed cause or outcome; independently verify authorized sources before using this narrative for a customer decision.</p>'
    : '';
  const sourceBound = (stage, value) => {
    const state = record.evidence.find(entry => entry.stage === stage).state;
    const display = value === null ? 'not established' : value;
    return escape(state === 'observed' ? display : `${display} (${state.replaceAll('_', ' ')}, not observed)`);
  };
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>${escape(record.reference)} | One-Issue Diagnostic Draft</title><style>${css}</style></head>
<body><a class="skip" href="#main">Skip to report</a><div class="page">
<header class="masthead"><span class="brand">WILKE <small>SERVICE CO.</small></span><span class="doc-kind">ONE-ISSUE SOFTWARE DIAGNOSTIC</span></header>
<main id="main"><div class="warning" role="note"><strong>${banner}</strong><span>Generated offline. No order, report send, customer acknowledgment, acceptance or payment was verified.</span></div>
<div class="hero"><div><p class="eyebrow">DIAGNOSTIC REPORT / ${escape(record.reference)}</p><h1>Evidence before conclusions.</h1><p class="subhead">${escape(record.question)}</p></div><div class="verdict"><span>CLAIM AUDIT</span><strong>${escape(audit.verdict)}</strong></div></div>
<div class="meta"><div><span>Classification</span><strong>${sample ? 'Fictional synthetic fixture' : 'Sanitized operator draft'}</strong></div><div><span>Issue type</span><strong>${escape(record.issueType)}</strong></div><div><span>Source/version</span><strong>${escape(record.sourceVersion)}</strong></div><div><span>Prepared UTC</span><strong>${escape(preparedAt)}</strong></div></div>
<section><h2>01 / Question and limits</h2><div class="duo"><p><strong>Expected:</strong> ${escape(record.expected)}</p><p><strong>Actual:</strong> ${escape(record.actual)}</p><p><strong>Environment:</strong> ${escape(record.environment)}</p><p><strong>Permission basis:</strong> ${escape(record.permission)}</p></div><p><strong>Reproduction:</strong> ${escape(record.reproduction)}</p></section>
<section><h2>02 / Independent evidence layers</h2><p class="explain">An HTTP success code cannot establish application acceptance, persistence or a receiving-owner acknowledgment.</p>
<div class="table-wrap"><table><caption>Operator-supplied sanitized evidence; references must be checked privately</caption><thead><tr><th scope="col">Stage</th><th scope="col">Status</th><th scope="col">Bounded observation</th><th scope="col">Reference</th></tr></thead><tbody>${rows}</tbody></table></div>
<div class="audit"><div><span>HTTP</span><strong>${sourceBound("transport", record.facts.transport.httpStatus)}</strong></div><div><span>Application</span><strong>${sourceBound("application", record.facts.application.result)}</strong></div><div><span>Saved record</span><strong>${audit.verifiedSave ? 'Verified by supplied references' : 'Not verified'}</strong></div><div><span>Recipient</span><strong>${audit.recipientVerified ? 'Receipt supplied; verify separately' : 'No verified receipt'}</strong></div></div></section>
<section><h2>03 / ${findingsHeading}</h2>${confidenceNote}<dl><dt>${findingLabel}</dt><dd>${escape(record.analysis.finding)}</dd><dt>Likely cause — hypothesis</dt><dd>${escape(record.analysis.likelyCause)}</dd><dt>Alternatives</dt><dd>${escape(record.analysis.alternatives)}</dd><dt>Unresolved</dt><dd>${escape(record.analysis.unknowns)}</dd><dt>Prioritized repair proposal (not implemented)</dt><dd>${escape(record.analysis.recommendation)}</dd></dl></section>
<section><h2>04 / Suggested tests after separately authorized repair</h2><ol>${checks}</ol><p><strong>Included clarification:</strong> ${escape(record.clarification)}</p></section>
<section class="review"><h2>05 / Real delivery and customer acceptance</h2><p>This output is a <strong>draft</strong>. Before any private send, confirm the real agreed scope, system-owner permission, evidence/source references, approved delivery channel, customer-designated reviewer and payment terms. Do not send secrets or raw production logs.</p><dl><dt>Delivered to reviewer</dt><dd>NOT SENT — no delivery receipt</dd><dt>Reviewer decision</dt><dd>NOT RECORDED — silence is not acceptance</dd><dt>Payment</dt><dd>UNVERIFIED — no settlement evidence</dd><dt>Production implementation</dt><dd>NOT INCLUDED — requires a separate authorized scope</dd></dl><p>Acceptance of a written diagnosis never establishes a deployed repair, downstream message delivery or recovered revenue.</p></section>
<footer><p>${escape(audit.warning)}</p><p>Generated locally · Private draft or fictional sample · No browser requests, form actions or checkout.</p></footer></main></div></body></html>`;
}

function sha256(value) { return createHash('sha256').update(value).digest('hex').toUpperCase(); }

function isInside(root, path) {
  const delta = relative(root, path);
  return !isAbsolute(delta) && delta !== '..' && !delta.startsWith('..' + sep);
}

async function resolveExistingAncestors(path) {
  try {
    return await realpath(path);
  } catch (error) {
    const parent = dirname(path);
    if (error.code !== 'ENOENT' || parent === path) throw error;
    return join(await resolveExistingAncestors(parent), basename(path));
  }
}

export async function resolvePrivateHandoffPath(path) {
  const target = resolve(path);
  const reason = 'Private report and QA paths must stay outside the public Git repository';
  if (isInside(REPO_ROOT, target)) throw new Error(reason);
  const [physicalRepo, physicalTarget] = await Promise.all([realpath(REPO_ROOT), resolveExistingAncestors(target)]);
  if (isInside(physicalRepo, physicalTarget)) throw new Error(reason);
  return physicalTarget;
}

export async function writeHandoffPackage(raw, outDir, { css, preparedAt = new Date().toISOString() } = {}) {
  const report = validateReportInput(raw);
  if (typeof css !== 'string' || !css.includes('@media print')) throw new Error('Local printable report CSS required');
  if (Number.isNaN(Date.parse(preparedAt)) || !/Z$/.test(preparedAt)) throw new Error('preparedAt must be a UTC ISO timestamp');
  const target = await resolvePrivateHandoffPath(outDir);
  const audit = auditClaims(report);
  const html = renderReportHtml(report, audit, css, preparedAt);
  const evidenceHash = sha256(JSON.stringify(report));
  const reportHash = sha256(html);
  const manifest = {
    schema: 'wilke-one-issue-private-handoff-v1', generatedAt: preparedAt,
    classification: report.classification, reference: report.reference, issueType: report.issueType,
    normalizedInputSha256: evidenceHash, reportHtmlSha256: reportHash,
    evidenceCount: report.evidence.length, audit,
    privacy: 'heuristic redaction check passed; manual authorized review still required',
    publicRelease: false, externalSideEffects: false, deliveredToCustomer: false,
    customerAcceptanceRecorded: false, paymentVerified: false, independentSourceVerification: false
  };
  const checklist = `# ${report.reference} — PRIVATE handoff checklist\n\n` +
    `- [ ] Verify real customer/system owner and scope acceptance in the agreed private channel.\n` +
    `- [ ] Verify each evidence reference against the original authorized system; this generator cannot.\n` +
    `- [ ] Manually review all text for names, credentials, log payloads, direct identifiers and copyright.\n` +
    `- [ ] Confirm $150 one-issue payment timing/terms and founder-approved route separately.\n` +
    `- [ ] Obtain internal review of report and approve exact version/hash for release.\n` +
    `- [ ] Deliver privately to named reviewer and capture actual message/attachment receipt.\n` +
    `- [ ] Request explicit report acceptance, one clarification or disputed deliverable reply.\n` +
    `- [ ] Reconcile payment from a real processor/marketplace event; do not infer from report.\n` +
    `- [ ] Retain/delete sanitized artifacts on the agreed schedule.\n\n` +
    `Prepared only at ${preparedAt}; this tool sent nothing and confirmed no payment.\n`;
  await mkdir(target); // Fail closed instead of overwriting an existing handoff.
  await writeFile(join(target, 'report.html'), html, { flag: 'wx' });
  await writeFile(join(target, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
  await writeFile(join(target, 'delivery-checklist.md'), checklist, { flag: 'wx' });
  return { target, manifest, outputFiles: ['report.html', 'manifest.json', 'delivery-checklist.md'] };
}
