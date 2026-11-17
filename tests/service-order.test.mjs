import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const order = readFileSync(new URL("../diagnostic-case-lab/service-order/index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../diagnostic-case-lab/service-order/styles.css", import.meta.url), "utf8");
const lab = readFileSync(new URL("../diagnostic-case-lab/index.html", import.meta.url), "utf8");
const readme = readFileSync(new URL("../diagnostic-case-lab/README.md", import.meta.url), "utf8");

test("public case links to the real buyer-facing, blank service-order summary", () => {
  assert.match(lab, /href="\.\/service-order\/"[^>]*>Review proposed \$150 service terms/);
  assert.match(readme, /Printable client service-order summary/);
  assert.match(order, /<html lang="en">/);
  assert.match(order, /<main>/);
  assert.match(order, /<h1 id="order-title">One-Issue Software Diagnostic<\/h1>/);
  assert.match(order, /<meta name="robots" content="noindex,nofollow">/);
  assert.doesNotMatch(order, /rel="canonical"/);
});

test("scope and price stay bounded to the published inquiry-only product", () => {
  assert.match(order, /\$150 USD/);
  assert.match(order, /one time/);
  assert.match(order, /one agreed JavaScript\/Node\.js API, webhook or lead-form failure/);
  assert.match(order, /one clarification/);
  assert.match(order, /not implementation/);
  assert.match(order, /No production implementation/);
  assert.match(order, /Any repair is separately scoped and authorized/);
});

test("blank order cannot submit, collect customer data, or create a payment", () => {
  assert.doesNotMatch(order, /<(form|input|textarea|button|script|iframe|select)\b/i);
  assert.doesNotMatch(order, /<[^>]+(?:contenteditable|autofocus)=/i);
  assert.doesNotMatch(order, /mailto:|stripe\.com|squareup\.com|checkout\./i);
  assert.doesNotMatch(order, /(?:localStorage|sessionStorage|sendBeacon|fetch\s*\()/);
  assert.match(order, /No booking, acceptance, invoice or payment has occurred through this page/);
  assert.match(order, /No information entered, saved or submitted here/);
});

test("customer and provider both affirm precise scope, permission and payment terms", () => {
  assert.match(order, /Customer and authorized owner/);
  assert.match(order, /One issue and expected result/);
  assert.match(order, /Environment, evidence and side-effect limits/);
  assert.match(order, /Report target and reviewer/);
  assert.match(order, /Payment and cancellation terms/);
  assert.match(order, /Retention and deletion/);
  assert.match(order, /founder-approved payment route/);
  assert.match(order, /Customer:<\/strong> affirm/);
  assert.match(order, /Wilke Service Co\.:<\/strong> independently confirm/);
  assert.match(order, /An inquiry or silence is not acceptance/);
  assert.match(order, /Name, role, date and issue reference: \[customer completes privately\]/);
});

test("privacy, marketplace and downstream report acceptance remain explicit", () => {
  assert.match(order, /Never send passwords, API keys, personal records or raw production logs/);
  assert.match(order, /agreed private evidence channel/);
  assert.match(order, /Silence is not report acceptance/);
  assert.match(order, /report acceptance does not prove a fix or payment/);
  assert.match(order, /If the relationship began on Upwork, keep discussion and payment on Upwork/);
  assert.match(order, /you must send the prepared message yourself/);
});

test("service-order summary has responsive and printable layouts without action JS", () => {
  assert.match(css, /@media\(max-width:650px\)/);
  assert.match(css, /@media print/);
  assert.match(css, /@page\{size:letter;/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /break-inside:avoid/);
  assert.match(order, /href="\.\/styles\.css"/);
  assert.doesNotMatch(order, /sk_live_|ghp_|BEGIN PRIVATE KEY|C:\\Users|C:\\dev/i);
});
