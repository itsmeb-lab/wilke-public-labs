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
});
