#!/usr/bin/env node
// Independent installed-Chrome QA of one offline-generated private report.
// Uses an isolated Chrome profile; file:// only; no customer form or external request.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { setTimeout as pause } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import { resolvePrivateHandoffPath } from './handoff-builder.mjs';

const arg = name => { const i = process.argv.indexOf(name); return i < 0 ? null : process.argv[i + 1]; };
const report = arg('--report');
const root = arg('--out-dir');
if (!report || !root) throw new Error('Usage: node verify-handoff-browser.mjs --report <private-report.html> --out-dir <private-receipt-root>');
const [htmlPath, receiptRoot] = await Promise.all([resolvePrivateHandoffPath(report), resolvePrivateHandoffPath(root)]);
await mkdir(receiptRoot, { recursive: true });
const outputDir = await mkdtemp(join(receiptRoot, 'atlas-l04-handoff-browser-'));
const profile = await mkdtemp(join(tmpdir(), 'atlas-l04-private-browser-'));
const sha256 = buffer => createHash('sha256').update(buffer).digest('hex').toUpperCase();
const summary = { schema: 'atlas-l04-private-handoff-browser-qa-v1', reportPath: htmlPath,
  viewports: [], printablePdf: null, requests: [], keyboard: null, errors: [], result: 'INCOMPLETE' };
const chromeCandidates = [process.env.CHROME_BIN,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean);
let browserProcess, socket, sessionId, nextId = 0;
const pending = new Map();

async function installedChrome() {
  for (const path of chromeCandidates) try { await access(path); return path; } catch { /* next known installation */ }
  throw new Error('No already-installed Chrome/Edge available; nothing installed');
}

async function chromePort() {
  for (let i = 0; i < 120; i++) {
    if (browserProcess?.exitCode !== null) throw new Error('Chrome exited before CDP was available');
    try {
      const data = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).trim().split(/\r?\n/);
      if (/^\d+$/.test(data[0])) return Number(data[0]);
    } catch { /* profile pending */ }
    await pause(100);
  }
  throw new Error('Timed out waiting for isolated browser');
}

function command(method, params = {}, targetSessionId = sessionId) {
  return new Promise((resolveCommand, rejectCommand) => {
    const id = ++nextId;
    pending.set(id, { resolve: resolveCommand, reject: rejectCommand });
    socket.send(JSON.stringify({ id, method, params, ...(targetSessionId ? { sessionId: targetSessionId } : {}) }));
  });
}

async function evaluate(expression) {
  const { result, exceptionDetails } = await command('Runtime.evaluate',
    { expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) throw new Error(exceptionDetails.text);
  return result.value;
}

async function waitForReport() {
  for (let i = 0; i < 75; i++) {
    try { if (await evaluate("!!document.querySelector('h1') && document.readyState === 'complete'")) return; }
    catch { /* navigation pending */ }
    await pause(100);
  }
  throw new Error('Local report did not render in Chrome');
}

async function checkViewport(width) {
  await command('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: width < 700 });
  const data = await evaluate(`(() => ({ width:innerWidth, scrollWidth:document.documentElement.scrollWidth,
    banner:document.querySelector('.warning')?.textContent.trim(),
    headings:document.querySelectorAll('h1').length, main:document.querySelectorAll('main').length,
    evidenceRows:document.querySelectorAll('tbody tr').length,
    tableCaption:!!document.querySelector('table caption'),
    mobileCaptionVisuallyHidden:getComputedStyle(document.querySelector('table caption')).clipPath === 'inset(50%)',
    mobileEvidenceCards:getComputedStyle(document.querySelector('tbody tr')).display === 'block' &&
      getComputedStyle(document.querySelector('tbody td')).display === 'grid',
    mobileLabelWidth:parseFloat(getComputedStyle(document.querySelector('tbody td')).gridTemplateColumns),
    forms:document.querySelectorAll('form,input,textarea,button,script,iframe').length,
    robots:document.querySelector('meta[name="robots"]')?.content,
    font:getComputedStyle(document.querySelector('h1')).fontFamily
  }))()`);
  assert.equal(data.width, width);
  assert.ok(data.scrollWidth <= width, `report overflows at ${width}: ${data.scrollWidth}`);
  assert.equal(data.headings, 1);
  assert.equal(data.main, 1);
  assert.ok(data.evidenceRows >= 4);
  assert.equal(data.tableCaption, true);
  if (width <= 390) {
    assert.equal(data.mobileEvidenceCards, true, 'evidence must render as labeled mobile cards');
    assert.equal(data.mobileCaptionVisuallyHidden, true, 'caption must remain semantic without narrow visible text');
    assert.ok(data.mobileLabelWidth >= 80, 'mobile evidence labels need at least 80px');
  }
  assert.equal(data.forms, 0);
  assert.match(data.robots, /noindex/);
  assert.match(data.banner, /NOT A CLIENT CASE|NOT DELIVERED/);
  if (width <= 390) {
    const layout = await command('Page.getLayoutMetrics');
    const image = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true,
      clip: { x: 0, y: 0, width, height: Math.ceil(layout.cssContentSize.height), scale: 1 } });
    const filename = `private-report-${width}px.png`;
    await writeFile(join(outputDir, filename), Buffer.from(image.data, 'base64'));
    data.screenshot = filename;
  }
  summary.viewports.push(data);
}

try {
  const html = await readFile(htmlPath);
  const manifest = JSON.parse(await readFile(join(dirname(htmlPath), 'manifest.json'), 'utf8'));
  assert.equal(sha256(html), manifest.reportHtmlSha256, 'must verify exact generated report hash');
  assert.equal(manifest.deliveredToCustomer, false);
  assert.equal(manifest.customerAcceptanceRecorded, false);
  assert.equal(manifest.paymentVerified, false);
  summary.reportSha256 = sha256(html);
  const chrome = await installedChrome();
  browserProcess = spawn(chrome, ['--headless=new', '--no-first-run', '--no-default-browser-check',
    '--disable-background-networking', '--disable-extensions', '--disable-sync',
    '--disable-default-apps', '--disable-component-update', '--disable-gpu',
    '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', '--remote-allow-origins=*',
    '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true });
  const port = await chromePort();
  const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  summary.browser = version.Browser;
  socket = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((ok, no) => {
    socket.addEventListener('open', ok, { once: true });
    socket.addEventListener('error', no, { once: true });
  });
  socket.addEventListener('message', event => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const current = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) current.reject(new Error(msg.error.message)); else current.resolve(msg.result ?? {});
    } else if (msg.method === 'Network.requestWillBeSent') summary.requests.push(msg.params.request.url);
  });
  const target = await command('Target.createTarget', { url: 'about:blank' }, undefined);
  ({ sessionId } = await command('Target.attachToTarget', { targetId: target.targetId, flatten: true }, undefined));
  await command('Page.enable'); await command('Runtime.enable'); await command('Network.enable');
  const fileUrl = pathToFileURL(htmlPath).href;
  await command('Page.navigate', { url: fileUrl });
  await waitForReport();
  await checkViewport(320);
  await checkViewport(390);
  await checkViewport(1280);
  const jump = await evaluate(`(() => { const skip=document.querySelector('.skip'); skip.focus();
    return { focusable:document.activeElement===skip, target:!!document.querySelector(skip.getAttribute('href')),
      visibleOutline:parseFloat(getComputedStyle(skip).outlineWidth) }; })()`);
  assert.equal(jump.focusable, true);
  assert.equal(jump.target, true);
  assert.ok(jump.visibleOutline >= 2);
  summary.keyboard = { skipTargetReachable: true, visibleFocusOutlinePx: jump.visibleOutline };
  const pdf = await command('Page.printToPDF', { preferCSSPageSize: true,
    printBackground: true, transferMode: 'ReturnAsBase64' });
  const bytes = Buffer.from(pdf.data, 'base64');
  assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
  const pages = (bytes.toString('latin1').match(/\/Type\s*\/Page\b/g) ?? []).length;
  assert.ok(pages >= 1 && pages <= 4, `unexpected print pagination: ${pages}`);
  await writeFile(join(outputDir, 'private-report-print.pdf'), bytes);
  summary.printablePdf = { filename: 'private-report-print.pdf', bytes: bytes.length, pages,
    sha256: sha256(bytes) };
  const external = summary.requests.filter(u => !u.startsWith('file:') && !u.startsWith('data:'));
  assert.deepEqual(external, [], 'rendering must not request external services');
  summary.result = 'PASS';
} catch (error) {
  summary.result = 'FAIL';
  summary.errors.push(String(error?.stack ?? error));
  process.exitCode = 1;
} finally {
  summary.requests = [...new Set(summary.requests)];
  await writeFile(join(outputDir, 'private-handoff-browser-qa.json'), JSON.stringify(summary, null, 2));
  if (socket?.readyState === WebSocket.OPEN) {
    try { await Promise.race([command('Browser.close', {}, undefined), pause(1200)]); } catch { /* process cleanup */ }
    socket.close();
  }
  browserProcess?.kill();
  try { await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* isolated profile only */ }
  console.log(JSON.stringify({ result: summary.result, sourceHash: summary.reportSha256,
    viewports: summary.viewports, pdf: summary.printablePdf, keyboard: summary.keyboard,
    networkRequests: summary.requests, errors: summary.errors, outputDir }, null, 2));
}
