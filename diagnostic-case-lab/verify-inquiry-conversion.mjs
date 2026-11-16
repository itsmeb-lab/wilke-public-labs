#!/usr/bin/env node
// Non-sensitive, in-memory handoff QA of the published offer. NEVER send or submit.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as pause } from 'node:timers/promises';
import { allowInquiryRequest } from './inquiry-network-policy.mjs';

const page = await readFile(new URL('./index.html', import.meta.url), 'utf8');
const found = page.match(/data-diagnostic-link href="([^"]+)"/);
assert.ok(found, 'case lab has no offer CTA');
const target = new URL(found[1].replaceAll('&amp;', '&'));
assert.equal(target.origin, 'https://wilkeservices.com');
assert.equal(target.pathname, '/software-diagnostic');
assert.equal(target.hash, '#scope-request');
assert.equal(target.searchParams.get('utm_source'), 'wilke_public_labs');
assert.equal(target.searchParams.get('utm_content'), 'diagnostic_case_lab');
const outIndex = process.argv.indexOf('--out-dir');
const outRoot = outIndex < 0 ? tmpdir() : process.argv[outIndex + 1];
assert.ok(outRoot, 'missing output directory');
await mkdir(outRoot, { recursive: true });
const out = await mkdtemp(join(outRoot, 'atlas-l04-inquiry-'));
const profile = await mkdtemp(join(tmpdir(), 'atlas-l04-inquiry-profile-'));
const candidates = [
  process.env.CHROME_BIN,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].filter(Boolean);
const fixture = {
  system: '[SYNTHETIC] Node.js false-success demo (no customer system)',
  symptom: 'SYN-API-001 simulated HTTP 200 with rejected save; no actual lead.',
  expected: 'For this fictional case, show NOT SAVED until a matching row reference exists.'
};
const receipt = {
  schema: 'atlas-l04-inquiry-conversion-acceptance-v1',
  candidateLink: target.href, fixture: 'SYN-API-001', synthetic: true,
  submittedLead: false, emailSent: false, checkoutOpened: false,
  networkPolicy: 'Only exact four non-personal UTM keys on page GET and query-free first-party static GET; abort every other request before entry.',
  allowed: [], blocked: [], checks: {}, gaps: [], result: 'INCOMPLETE'
};
let chrome, socket, sessionId, serial = 0;
const pending = new Map();
async function browserPath() {
  for (const path of candidates) { try { await access(path); return path; } catch {} }
  throw new Error('No installed Chrome or Edge; nothing installed');
}
function record(req) {
  try { const u = new URL(req.url); return { origin: u.origin, path: u.pathname, method: req.method }; }
  catch { return { origin: '?', path: '?', method: req.method }; }
}
function send(method, params = {}, sid = sessionId) {
  return new Promise((resolve, reject) => {
    const id = ++serial;
    pending.set(id, { resolve, reject, method });
    socket.send(JSON.stringify({ id, method, params, ...(sid ? { sessionId: sid } : {}) }));
  });
}
async function readyPort() {
  for (let i = 0; i < 130; i++) {
    if (chrome?.exitCode !== null) throw new Error('Disposable browser exited early');
    try {
      const lines = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).trim().split(/\r?\n/);
      if (/^\d+$/.test(lines[0])) return Number(lines[0]);
    } catch {}
    await pause(100);
  }
  throw new Error('Disposable browser did not start');
}
async function connect(port) {
  const v = await (await fetch('http://127.0.0.1:' + port + '/json/version')).json();
  socket = new WebSocket(v.webSocketDebuggerUrl);
  await Promise.race([
    new Promise((ok, fail) => { socket.addEventListener('open', ok, { once: true });
      socket.addEventListener('error', fail, { once: true }); }),
    new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error('CDP connection timeout')), 8000); timer.unref(); })
  ]);
  socket.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      const x = pending.get(m.id); pending.delete(m.id);
      if (m.error) x.reject(new Error(x.method + ': ' + m.error.message));
      else x.resolve(m.result ?? {});
    } else if (m.method === 'Fetch.requestPaused') {
      const ok = allowInquiryRequest(m.params.request);
      receipt[ok ? 'allowed' : 'blocked'].push(record(m.params.request));
      const cmd = ok ? 'Fetch.continueRequest' : 'Fetch.failRequest';
      const args = ok ? { requestId: m.params.requestId } :
        { requestId: m.params.requestId, errorReason: 'BlockedByClient' };
      void send(cmd, args, m.sessionId).catch(error => receipt.gaps.push('CDP interception: ' + error.message));
    }
  });
  return v.Browser;
}
async function runJs(expression) {
  const v = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (v.exceptionDetails) throw new Error('Page evaluation: ' + v.exceptionDetails.text);
  return v.result?.value;
}
async function waitFor(check, what, limit = 100) {
  for (let i = 0; i < limit; i++) { if (await check()) return; await pause(100); }
  throw new Error('Timed out waiting for ' + what);
}
async function enter(id, value) {
  const expression = '(() => { const el = document.getElementById(' + JSON.stringify(id) +
    '); const value = ' + JSON.stringify(value) +
    '; const proto = el.tagName === "INPUT" ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;' +
    ' Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);' +
    ' el.dispatchEvent(new Event("input",{bubbles:true}));' +
    ' el.dispatchEvent(new Event("change",{bubbles:true})); return el.value === value; })()';
  assert.equal(await runJs(expression), true, 'in-memory fixture field failed');
  await pause(80);
}
try {
  chrome = spawn(await browserPath(), [
    '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--disable-background-networking', '--disable-sync', '--disable-default-apps',
    '--disable-component-update', '--disable-gpu', '--remote-debugging-address=127.0.0.1',
    '--remote-debugging-port=0', '--remote-allow-origins=*',
    '--user-data-dir=' + profile, 'about:blank'
  ], { stdio: 'ignore', windowsHide: true });
  receipt.browser = await connect(await readyPort());
  const tab = await send('Target.createTarget', { url: 'about:blank' }, null);
  ({ sessionId } = await send('Target.attachToTarget', { targetId: tab.targetId, flatten: true }, null));
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
  await send('Page.navigate', { url: target.href });
  await waitFor(async () => await runJs('!!document.getElementById("diagnostic-expected")'), 'offer controls');
  await waitFor(async () => await runJs('document.readyState === "complete"'), 'page load');
  await pause(700);
  const info = await runJs('(() => { const s=document.getElementById("scope-request"); const t=s?.textContent??"";' +
    ' const u=new URL(location.href); return { anchor:!!s, noForm:s?.querySelectorAll("form").length===0,' +
    ' required:s?.querySelectorAll("[aria-required=true]").length, privacy:[...s.querySelectorAll("a")].some(a=>a.getAttribute("href")==="/privacy"),' +
    ' noSecrets:t.includes("No files, passwords, API keys"), noSend:t.includes("This composer does not submit a form.")' +
    ' && t.includes("Preparing it does not send anything."),' +
    ' upwork:t.includes("Keep pre-contract discussion and payment there."),' +
    ' source:u.searchParams.get("utm_source"),campaign:u.searchParams.get("utm_content") }; })()');
  assert.deepEqual(info, { anchor: true, noForm: true, required: 3,
    privacy: true, noSecrets: true, noSend: true, upwork: true,
    source: 'wilke_public_labs', campaign: 'diagnostic_case_lab' });
  receipt.checks.privacyAndConsent = info;
  await enter('diagnostic-system', fixture.system);
  await enter('diagnostic-symptom', fixture.symptom);
  await enter('diagnostic-expected', fixture.expected);
  assert.equal(await runJs('(() => { const b=[...document.querySelectorAll("#scope-request button")]' +
    '.find(x=>x.textContent.trim()==="Prepare inquiry"); if(!b)return false; b.click(); return true; })()'), true);
  await waitFor(async () => await runJs('!!document.querySelector("[data-diagnostic-inquiry=prepared]")'),
    'prepared but unsent preview');
  const draft = await runJs('(() => { const p=document.querySelector("[data-diagnostic-inquiry=prepared]");' +
    ' const b=[...p.querySelectorAll("button")].map(x=>x.textContent); const v=document.getElementById("diagnostic-output");' +
    ' return { status:p.textContent.includes("Brief prepared—not sent."),' +
    ' manual:p.textContent.includes("You must send the email yourself."),' +
    ' openEmail:b.some(x=>x.includes("Open email app")),copy:b.some(x=>x.includes("Copy brief")),' +
    ' readonly:v.readOnly, value:v.value }; })()');
  assert.ok(draft.status && draft.manual && draft.openEmail && draft.copy && draft.readonly);
  for (const v of Object.values(fixture)) assert.ok(draft.value.includes(v), 'preview lost in-memory field');
  assert.doesNotMatch(draft.value, /sk_live_|ghp_|Bearer\s+\S+|-----BEGIN PRIVATE KEY-----/i);
  receipt.checks.preview = { preparedNotSent: true, deliveryUnknown: true, inputPreserved: true,
    length: draft.value.length, sha256: createHash('sha256').update(draft.value).digest('hex') };
  await runJs('(() => { const p=document.querySelector("[data-diagnostic-inquiry=prepared]");' +
    ' const b=[...p.querySelectorAll("button")].find(x=>x.textContent.includes("Copy brief"));' +
    ' b.click(); return true; })()');
  await pause(400);
  const status = await runJs('(() => { const p=document.querySelector("[data-diagnostic-inquiry=prepared]");' +
    ' return [...p.querySelectorAll("[role=status]")].map(e=>e.textContent).join(" "); })()');
  assert.match(status, /nothing has been sent/i);
  receipt.checks.copy = { noFalseSend: true, copiedNotice: /Copied to your clipboard/.test(status),
    manualFallback: /Select and copy/.test(status) };
  const sourceInDraft = ['wilke_public_labs', 'diagnostic_case_lab'].some(s => draft.value.includes(s));
  receipt.checks.attribution = { landingSourcePresent: true, preparedMessageCarriesSource: sourceInDraft };
  if (!sourceInDraft) receipt.gaps.push('The landing URL retains the source tags but the prepared message omits them; inbox attribution remains unverified.');
  assert.ok(receipt.allowed.length > 1, 'no actual read-only browser source loaded');
  assert.ok(receipt.allowed.every(x => x.method === 'GET' && x.origin === 'https://wilkeservices.com'));
  receipt.checks.transmission = { readOnlyFirstPartyGET: receipt.allowed.length, blocked: receipt.blocked.length,
    outboundMessageSent: false, productionLeadSubmitted: false };
  receipt.result = sourceInDraft ? 'PASS' : 'PASS_WITH_ATTRIBUTION_GAP';
} catch (error) {
  receipt.result = 'FAIL'; receipt.gaps.push(String(error?.stack ?? error)); process.exitCode = 1;
} finally {
  receipt.allowed = [...new Set(receipt.allowed.map(JSON.stringify))].map(JSON.parse);
  receipt.blocked = [...new Set(receipt.blocked.map(JSON.stringify))].map(JSON.parse);
  if (receipt.checks.transmission) receipt.checks.transmission.readOnlyFirstPartyGET = receipt.allowed.length;
  await writeFile(join(out, 'inquiry-conversion-acceptance.json'), JSON.stringify(receipt, null, 2));
  if (socket?.readyState === WebSocket.OPEN) {
    try { await Promise.race([send('Browser.close', {}, null), pause(1200)]); } catch {}
    socket.close();
  }
  chrome?.kill();
  try { await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch {}
  console.log(JSON.stringify({ result: receipt.result, browser: receipt.browser, checks: receipt.checks,
    allowed: receipt.allowed.length, blocked: receipt.blocked, gaps: receipt.gaps,
    receiptFile: join(out, 'inquiry-conversion-acceptance.json') }, null, 2));
}
