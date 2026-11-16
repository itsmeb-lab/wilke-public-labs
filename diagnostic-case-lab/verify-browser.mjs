#!/usr/bin/env node
// Dependency-free, isolated Chrome/CDP QA for the synthetic diagnostic case.
// Does not connect to an existing browser profile, account, or external URL.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { access, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { setTimeout as pause } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputArgIndex = process.argv.indexOf('--out-dir');
const outputRoot = outputArgIndex >= 0 ? resolve(process.argv[outputArgIndex + 1] ?? '') : tmpdir();
await mkdir(outputRoot, { recursive: true });
const outputDir = await mkdtemp(join(outputRoot, 'atlas-l04-run-'));
const profile = await mkdtemp(join(tmpdir(), 'atlas-l04-chrome-profile-'));
const chromeCandidates = [
  process.env.CHROME_BIN,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'
].filter(Boolean);
const mime = new Map([['.html', 'text/html; charset=utf-8'], ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'], ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'], ['.png', 'image/png'], ['.svg', 'image/svg+xml']]);
const summary = { schema: 'atlas-l04-independent-browser-qa-v1', synthetic: true,
  externalCustomerData: false, source: 'diagnostic-case-lab/', viewports: [], requests: [],
  receipt: null, accessibility: null, screenshots: [], errors: [], result: 'INCOMPLETE' };
let browserProcess, server, socket;
let sessionId, nextId = 0;
const pending = new Map();
const events = [];

function timeoutAfter(ms, reason) {
  return new Promise((_, reject) => {
    const timer = setTimeout(() => reject(new Error(reason)), ms);
    timer.unref();
  });
}

async function existingChrome() {
  for (const candidate of chromeCandidates) {
    try { await access(candidate); return candidate; } catch { /* try next installed binary */ }
  }
  throw new Error('No installed Chrome/Edge binary; set CHROME_BIN to an existing browser. Nothing installed.');
}

async function serve() {
  server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
      const filePath = resolve(repo, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
      if (!(filePath.startsWith(repo + sep))) { response.writeHead(403).end(); return; }
      const content = await readFile(filePath);
      response.writeHead(200, { 'Content-Type': mime.get(extname(filePath)) ?? 'text/plain',
        'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      response.end(content);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  return `http://127.0.0.1:${server.address().port}`;
}

async function chromePort() {
  for (let attempt = 0; attempt < 130; attempt++) {
    if (browserProcess?.exitCode !== null) throw new Error(`Chrome exited before debugging port: ${browserProcess.exitCode}`);
    try {
      const lines = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).trim().split(/\r?\n/);
      if (/^\d+$/.test(lines[0])) return Number(lines[0]);
    } catch { /* Chrome not ready */ }
    await pause(100);
  }
  throw new Error('Isolated Chrome did not start a debugging port within 13 seconds.');
}

async function connectCDP(port) {
  const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  socket = new WebSocket(version.webSocketDebuggerUrl);
  await Promise.race([new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener('open', resolveOpen, { once: true });
    socket.addEventListener('error', rejectOpen, { once: true });
  }), timeoutAfter(8000, 'CDP WebSocket did not connect')]);
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const task = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) task.reject(new Error(`${task.method}: ${message.error.message}`));
      else task.resolve(message.result ?? {});
    } else if (message.method) {
      events.push(message);
      if (message.method === 'Network.requestWillBeSent') summary.requests.push(message.params.request.url);
    }
  });
  return version.Browser;
}

function send(method, params = {}, targetSessionId) {
  return new Promise((resolveCommand, rejectCommand) => {
    const id = ++nextId;
    pending.set(id, { method, resolve: resolveCommand, reject: rejectCommand });
    socket.send(JSON.stringify({ id, method, params, ...(targetSessionId ? { sessionId: targetSessionId } : {}) }));
  });
}

async function evaluate(expression) {
  const { result, exceptionDetails } = await send('Runtime.evaluate',
    { expression, returnByValue: true, awaitPromise: true }, sessionId);
  if (exceptionDetails) throw new Error('Page evaluation failed: ' + (exceptionDetails.text ?? 'exception'));
  return result.value;
}

async function waitUntil(predicate, description, attempts = 70) {
  for (let i = 0; i < attempts; i++) {
    if (await predicate()) return;
    await pause(100);
  }
  throw new Error('Timed out waiting for ' + description);
}

function contrast(a, b) {
  function luminance(s) {
    const values = (s.match(/\d+(?:\.\d+)?/g) ?? []).slice(0, 3).map(Number);
    assert.equal(values.length, 3, 'expected RGB computed color');
    const linear = values.map(v => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  }
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

async function checkViewport(width, height) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 700 }, sessionId);
  const data = await evaluate(`(() => {
    const button = document.querySelector('.service-cta');
    const style = getComputedStyle(button);
    const footerText = document.querySelector('footer span').getBoundingClientRect();
    const footerLink = document.querySelector('footer a').getBoundingClientRect();
    const cells = [...document.querySelectorAll('#traceBody td')];
    return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
      color: style.color, background: style.backgroundColor,
      cards: cells.every(cell => cell.dataset.label && getComputedStyle(cell).display === 'grid'),
      labelColumnPx: cells.length ? parseFloat(getComputedStyle(cells[0]).gridTemplateColumns) : 0,
      footerSeparate: footerLink.top >= footerText.bottom - 1,
      traceCount: document.querySelectorAll('#traceBody tr').length,
      visibleCallToAction: button.getBoundingClientRect().width > 180 };
  })()`);
  assert.equal(data.width, width);
  assert.ok(data.scrollWidth <= width, `${width}px overflow: ${data.scrollWidth}`);
  assert.ok(data.visibleCallToAction);
  assert.equal(data.traceCount, 5);
  assert.ok(contrast(data.color, data.background) >= 4.5, `CTA contrast under 4.5 at ${width}px`);
  if (width <= 640) {
    assert.ok(data.cards, 'mobile table cells must be labeled cards');
    assert.ok(data.footerSeparate, 'mobile footer text/link overlap');
  }
  if (width <= 390) assert.ok(data.labelColumnPx >= 105, 'mobile evidence labels would wrap mid-word');
  const layout = await send('Page.getLayoutMetrics', {}, sessionId);
  if (width <= 390) {
    const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true,
      clip: { x: 0, y: 0, width, height: Math.ceil(layout.cssContentSize.height), scale: 1 } }, sessionId);
    const name = `diagnostic-${width}px-full.png`;
    await writeFile(join(outputDir, name), Buffer.from(screenshot.data, 'base64'));
    summary.screenshots.push(name);
  }
  summary.viewports.push({ ...data, contrast: Number(contrast(data.color, data.background).toFixed(2)) });
}

async function checkScenarios() {
  for (const [selector, expected] of [
    ['[data-case="rejected_save"][data-rule="legacy"]', 'FALSE SUCCESS'],
    ['[data-case="rejected_save"][data-rule="guarded"]', 'NOT SAVED'],
    ['[data-case="confirmed_save"][data-rule="guarded"]', 'SAVED · NOT DELIVERED']
  ]) {
    const result = await evaluate(`(() => { document.querySelector('${selector}').click(); return {
      text: document.querySelector('#resultStatus').textContent,
      pressed: document.querySelectorAll('[data-case][aria-pressed="true"]').length,
      receipt: JSON.parse(document.querySelector('#receiptJson').textContent)
    }; })()`);
    assert.equal(result.text, expected);
    assert.equal(result.pressed, 1);
    assert.equal(result.receipt.synthetic, true);
    assert.equal(result.receipt.externalSideEffects, false);
    assert.equal(result.receipt.trace.length, 5);
    assert.equal(result.receipt.diagnosis.notificationDelivery, 'unknown');
  }
}

async function pressKey(key, code, nativeCode) {
  const event = { key, code, windowsVirtualKeyCode: nativeCode, nativeVirtualKeyCode: nativeCode };
  if (key === 'Enter' || key === ' ') {
    event.text = key === 'Enter' ? '\r' : ' ';
    event.unmodifiedText = event.text;
  }
  await send('Input.dispatchKeyEvent', { type: 'keyDown', ...event }, sessionId);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', ...event }, sessionId);
}

async function checkKeyboardAccessibility() {
  const semantics = await evaluate("(() => ({ lang: document.documentElement.lang, mainCount: document.querySelectorAll('main').length, h1Count: document.querySelectorAll('h1').length, buttonsNamed: [...document.querySelectorAll('[data-case]')].every(button => button.textContent.trim().length > 0), liveStatus: document.querySelector('#resultStatus').getAttribute('role'), receiptSummary: !!document.querySelector('.receipt-details > summary') }))()");
  assert.equal(semantics.lang, 'en');
  assert.equal(semantics.mainCount, 1);
  assert.equal(semantics.h1Count, 1);
  assert.equal(semantics.buttonsNamed, true);
  assert.equal(semantics.liveStatus, 'status');
  assert.equal(semantics.receiptSummary, true);

  await send('Emulation.setEmulatedMedia',
    { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, sessionId);
  const reduced = await evaluate("({scroll: getComputedStyle(document.documentElement).scrollBehavior, transition: getComputedStyle(document.querySelector('[data-case]')).transitionDuration})");
  assert.equal(reduced.scroll, 'auto', 'reduced motion must disable smooth scrolling');
  assert.equal(reduced.transition, '0s', 'reduced motion must disable scenario transitions');
  await send('Emulation.setEmulatedMedia', { features: [] }, sessionId);

  await evaluate("document.querySelector('.head-link').focus()");
  await pressKey('Tab', 'Tab', 9);
  const firstFocus = await evaluate("({ first: document.activeElement === document.querySelectorAll('[data-case]')[0], visible: document.activeElement.matches(':focus-visible'), outline: getComputedStyle(document.activeElement).outlineWidth })");
  assert.equal(firstFocus.first, true, 'first scenario must follow header link in Tab order');
  assert.equal(firstFocus.visible, true, 'keyboard focus must use focus-visible');
  assert.ok(parseFloat(firstFocus.outline) >= 2, 'focus outline must be visible');

  await pressKey('Tab', 'Tab', 9);
  assert.equal(await evaluate("document.activeElement === document.querySelectorAll('[data-case]')[1]"), true,
    'second scenario must be next in Tab order');
  await pressKey('Enter', 'Enter', 13);
  const second = await evaluate("({pressed: document.querySelectorAll('[data-case]')[1].getAttribute('aria-pressed'), result: document.querySelector('#resultStatus').textContent})");
  assert.equal(second.pressed, 'true', 'Enter must activate truthful failure');
  assert.equal(second.result, 'NOT SAVED');

  await pressKey('Tab', 'Tab', 9);
  await pressKey(' ', 'Space', 32);
  const third = await evaluate("({pressed: document.querySelectorAll('[data-case]')[2].getAttribute('aria-pressed'), result: document.querySelector('#resultStatus').textContent})");
  assert.equal(third.pressed, 'true', 'Space must activate verified record');
  assert.equal(third.result, 'SAVED · NOT DELIVERED');

  await pressKey('Tab', 'Tab', 9);
  assert.equal(await evaluate("document.activeElement.id"), 'downloadBtn', 'receipt download must be keyboard reachable');
  await pressKey('Tab', 'Tab', 9);
  assert.equal(await evaluate("document.activeElement.tagName"), 'SUMMARY', 'receipt details must be keyboard reachable');
  await pressKey('Enter', 'Enter', 13);
  const details = await evaluate("({open: document.querySelector('.receipt-details').open, id: JSON.parse(document.querySelector('#receiptJson').textContent).caseId})");
  assert.equal(details.open, true, 'Enter must expand inspectable receipt');
  assert.equal(details.id, 'SYN-API-001');
  summary.accessibility = { ...semantics, keyboardTabOrder: true, visibleFocusOutline: firstFocus.outline,
    enterActivatesScenario: true, spaceActivatesScenario: true, receiptSummaryExpands: true,
    reducedMotion: reduced };
}

async function checkReceiptDownload() {
  await evaluate(`document.querySelector('[data-case="rejected_save"][data-rule="legacy"]').click()`);
  const before = await evaluate('document.querySelector("#receiptJson").textContent');
  await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: outputDir, eventsEnabled: true });
  await evaluate('document.querySelector("#downloadBtn").click()');
  const fileName = 'synthetic-diagnostic-rejected_save.json';
  const target = join(outputDir, fileName);
  await waitUntil(async () => {
    try { const info = await stat(target); return info.size > 0; } catch { return false; }
  }, 'sandboxed JSON download', 100);
  await waitUntil(async () => events.some(e => e.method === 'Browser.downloadProgress' && e.params.state === 'completed'),
    'Chrome completed download event', 40);
  const downloaded = await readFile(target, 'utf8');
  assert.equal(downloaded, before, 'download bytes must match visible JSON fallback');
  const parsed = JSON.parse(downloaded);
  assert.equal(parsed.caseId, 'SYN-API-001');
  assert.equal(parsed.synthetic, true);
  assert.equal(parsed.externalSideEffects, false);
  assert.equal(parsed.fixture, 'rejected_save');
  assert.equal(parsed.trace.length, 5);
  assert.ok(!/sk_live_|ghp_|Bearer\s+[A-Za-z0-9._-]+|-----BEGIN PRIVATE KEY-----/i.test(downloaded));
  summary.receipt = { filename: fileName, bytes: Buffer.byteLength(downloaded),
    browserCompletedEvent: true, matchesOnPagePreview: true, traceCount: parsed.trace.length,
    synthetic: parsed.synthetic, externalSideEffects: parsed.externalSideEffects };
}

try {
  await mkdir(outputDir, { recursive: true });
  const chrome = await existingChrome();
  const base = await serve();
  browserProcess = spawn(chrome, [
    '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--disable-background-networking', '--disable-sync', '--disable-default-apps',
    '--disable-component-update', '--disable-gpu', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0',
    '--remote-allow-origins=*', '--user-data-dir=' + profile, 'about:blank'
  ], { stdio: 'ignore', windowsHide: true });
  const port = await chromePort();
  summary.browser = await connectCDP(port);
  const target = await send('Target.createTarget', { url: 'about:blank' });
  ({ sessionId } = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true }));
  await send('Page.enable', {}, sessionId);
  await send('Runtime.enable', {}, sessionId);
  await send('Network.enable', {}, sessionId);
  await send('Page.navigate', { url: base + '/diagnostic-case-lab/' }, sessionId);
  await waitUntil(async () => (await evaluate('document.querySelectorAll("#traceBody tr").length')) === 5,
    'interactive synthetic fixture');
  await checkViewport(320, 740);
  await checkViewport(390, 844);
  await checkViewport(1280, 800);
  await checkScenarios();
  await checkKeyboardAccessibility();
  await checkReceiptDownload();
  const unexpected = summary.requests.filter(url => !url.startsWith(base) && !url.startsWith('data:') && !url.startsWith('blob:'));
  assert.deepEqual(unexpected, [], 'Page must not request external resources');
  summary.result = 'PASS';
} catch (error) {
  summary.result = 'FAIL';
  summary.errors.push(String(error?.stack ?? error));
  process.exitCode = 1;
} finally {
  summary.requests = [...new Set(summary.requests)];
  await writeFile(join(outputDir, 'diagnostic-browser-qa-summary.json'), JSON.stringify(summary, null, 2));
  if (socket?.readyState === WebSocket.OPEN) {
    try { await Promise.race([send('Browser.close'), pause(1200)]); } catch { /* close in next step */ }
    socket.close();
  }
  browserProcess?.kill();
  if (server) await new Promise(resolveClose => server.close(resolveClose));
  try { await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* safely leave isolated profile on lock */ }
  console.log(JSON.stringify({ result: summary.result, browser: summary.browser, viewports: summary.viewports,
    receipt: summary.receipt, networkRequests: summary.requests, screenshots: summary.screenshots,
    errors: summary.errors, outputDir }, null, 2));
}
