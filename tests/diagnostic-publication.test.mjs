import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../diagnostic-case-lab/index.html", import.meta.url), "utf8");
const app = readFileSync(new URL("../diagnostic-case-lab/app.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../diagnostic-case-lab/styles.css", import.meta.url), "utf8");

test("all visible scenarios bind to known deterministic fixtures and rules", () => {
  assert.match(page, /data-case="rejected_save" data-rule="legacy"/);
  assert.match(page, /data-case="rejected_save" data-rule="guarded"/);
  assert.match(page, /data-case="confirmed_save" data-rule="guarded"/);
  assert.equal((page.match(/data-case=/g) ?? []).length, 3);
});

test("browser case uses text-only evidence cells and no outbound transport", () => {
  assert.match(app, /cell\.textContent = String/);
  assert.match(app, /body\.replaceChildren\(fragment\)/);
  assert.doesNotMatch(app, /\.innerHTML\s*=|insertAdjacentHTML|document\.write|fetch\s*\(|XMLHttpRequest|sendBeacon/);
  assert.match(app, /URL\.revokeObjectURL\(url\)/);
});

test("case is mobile-friendly and clearly synthetic in its public markup", () => {
  assert.match(css, /@media\(max-width:500px\)/);
  assert.match(page, /Fully synthetic/);
  assert.match(page, /No network calls/);
  assert.match(page, /not paid-client results/);
  assert.match(page, /no checkout or customer data collection/);
});

test("delivery kit includes intake, explicit acceptance and non-sent follow-ups", () => {
  const read = (name) => readFileSync(new URL("../diagnostic-case-lab/" + name, import.meta.url), "utf8");
  assert.match(read("INTAKE_TEMPLATE.md"), /No secrets or personal records/);
  assert.match(read("DELIVERY_RUNBOOK.md"), /affirmative written reply/);
  assert.match(read("ACCEPTANCE_CHECKLIST.md"), /No automatic acceptance by silence/);
  assert.match(read("CUSTOMER_MESSAGES.md"), /not sent messages/);
  assert.match(read("SAMPLE_HANDOFF.md"), /synthetic case SYN-API-001/);
  assert.match(read("CUSTOMER_SCOPE_PACKET.md"), /not sent, signed, purchased, or accepted/);
  assert.match(read("REPORT_TEMPLATE.md"), /Blank customer-facing template/);
  assert.match(read("DELIVERY_RUNBOOK.md"), /engagement-gate assessor/);
});

test("mobile evidence is fully readable and shared offer variables resolve", () => {
  assert.match(css, /--surface:#fffefb;--accent:#174f74;/);
  assert.match(css, /@media\(max-width:640px\)/);
  assert.match(css, /td::before\{content:attr\(data-label\)/);
  assert.match(app, /cell\.dataset\.label = columnLabels\[key\]/);
  assert.match(css, /footer span\{display:block\}/);
});

test("public case CTA deep-links into the already-live, source-attributed inquiry composer", () => {
  const match = page.match(/data-diagnostic-link href="([^"]+)"/);
  assert.ok(match, "primary diagnostic CTA exists");
  const target = new URL(match[1].replaceAll("&amp;", "&"));
  assert.equal(target.origin, "https://wilkeservices.com");
  assert.equal(target.pathname, "/software-diagnostic");
  assert.equal(target.hash, "#scope-request");
  assert.equal(target.searchParams.get("utm_source"), "wilke_public_labs");
  assert.equal(target.searchParams.get("utm_content"), "diagnostic_case_lab");
  assert.doesNotMatch(page, /mailto:/);
});

test("synthetic receipt can be inspected without a browser download", () => {
  assert.match(page, /<details class="receipt-details">/);
  assert.match(page, /<pre id="receiptJson"><\/pre>/);
  assert.match(page, /id="downloadStatus" role="status"/);
  assert.match(app, /receiptJson"\)\.textContent = JSON\.stringify\(currentReceipt/);
  assert.match(app, /Download requested locally/);
  assert.match(app, /setTimeout\(\(\) => \{/);
});

test("keyboard access and reduced-motion behavior are release-checked", () => {
  const browser = readFileSync(new URL("../diagnostic-case-lab/verify-browser.mjs", import.meta.url), "utf8");
  assert.match(page, /<html lang="en">/);
  assert.match(page, /<strong id="resultStatus" role="status" aria-live="polite"/);
  assert.match(page, /<summary>Inspect the exact synthetic JSON receipt<\/summary>/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{html\{scroll-behavior:auto\}/);
  assert.match(css, /\.scenario-grid button\{transition:none\}/);
  assert.match(browser, /checkKeyboardAccessibility\(\)/);
  assert.match(browser, /pressKey\('Enter', 'Enter', 13\)/);
  assert.match(browser, /pressKey\(' ', 'Space', 32\)/);
});
