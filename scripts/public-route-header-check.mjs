import assert from "node:assert/strict";

const expectedMode = process.argv[2];
assert.ok(["baseline", "guarded"].includes(expectedMode));
const sites = [
  ["main-request", "https://wilkeservices.com/quote", "form"],
  ["main-cleanout", "https://wilkeservices.com/property/estate-rental-cleanouts", "form"],
  ["milwaukee-request", "https://milwaukee-hardwood.vercel.app/milwaukee/hardwood-flooring", "form"],
  ["main-health", "https://wilkeservices.com/api/health", "api"],
  ["milwaukee-health", "https://milwaukee-hardwood.vercel.app/api/health", "api"],
  ["main-control", "https://wilkeservices.com/resources/refinish-or-replace-hardwood-floors", "control"],
];

const rows = await Promise.all(sites.map(async ([id, address, type]) => {
  const response = await fetch(address, {
    redirect: "manual",
    headers: { "cache-control": "no-cache", "user-agent": "Wilke-Public-Read-Only-Checks/1.0" },
    signal: AbortSignal.timeout(12000),
  });
  const csp = response.headers.get("content-security-policy") ?? "";
  const guarded = /(?:^|[;,])\s*form-action\s+'none'\s*(?:;|,|$)/i.test(csp);
  const heading = response.headers.get("content-type") ?? "";
  const body = await response.text();
  const forms = [...body.matchAll(/<form\b[^>]*\bid=["']quote["'][^>]*>/gi)];
  const quoteMethod = forms[0]?.[0].match(/\bmethod=["']([^"']+)/i)?.[1] ?? null;
  return {
    id, type, status: response.status, guarded, hasPolicy: Boolean(csp),
    html: /^text\/html\b/i.test(heading),
    json: /^application\/json\b/i.test(heading),
    forms: forms.length, quoteMethod,
    nosniff: response.headers.get("x-content-type-options") === "nosniff",
  };
}));
console.log(JSON.stringify(rows));

for (const result of rows) {
  assert.equal(result.status, 200, result.id);
  assert.equal(result.guarded, expectedMode === "guarded" && result.type === "form", result.id);
  if (result.type === "form") {
    assert.ok(result.html && result.forms === 1, result.id + " quote page");
  } else if (result.type === "api") {
    assert.ok(result.json, result.id + " JSON health response");
  }
}
