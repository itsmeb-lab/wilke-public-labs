import assert from "node:assert/strict";

const expectedMode = process.argv[2];
assert.ok(["baseline", "guarded", "coverage-before", "coverage-after"].includes(expectedMode));
const sites = [
  ["main-request", "https://wilkeservices.com/quote", "form"],
  ["main-cleanout", "https://wilkeservices.com/property/estate-rental-cleanouts", "form"],
  ["milwaukee-request", "https://milwaukee-hardwood.vercel.app/milwaukee/hardwood-flooring", "form"],
  ["main-health", "https://wilkeservices.com/api/health", "api"],
  ["milwaukee-health", "https://milwaukee-hardwood.vercel.app/api/health", "api"],
  ["main-control", "https://wilkeservices.com/resources/refinish-or-replace-hardwood-floors", "control"],
];
if (expectedMode.startsWith("coverage-")) {
  const main = "https://wilkeservices.com";
  for (const [id, path] of [
    ["contact", "/contact"],
    ["residential", "/residential"],
    ["commercial", "/commercial"],
    ["landlords", "/landlords-property-managers"],
    ["service-areas", "/service-areas"],
    ["flooring-detail", "/flooring/hardwood-sanding-refinishing"],
    ["painting-detail", "/painting/cabinet-painting"],
    ["exterior-detail", "/exterior/pressure-washing"],
    ["setup-detail", "/setup/furniture-assembly"],
    ["commercial-detail", "/commercial/kitchen-exhaust-cleaning"],
    ["residential-detail", "/residential/carpet-upholstery-cleaning"],
    ["division-detail", "/services/flooring-carpet"],
    ["state-area", "/service-areas/south-carolina"],
    ["landing", "/lp/floor-paint-refresh"],
  ]) sites.push([id, main + path, "additional"]);
  sites.push(["tagged-request", main + "/quote?utm_source=route-check&utm_medium=fixture", "form"]);
  sites.push(["services-index", main + "/services", "control"]);
}

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
  const allForms = [...body.matchAll(/<form\b[^>]*>/gi)];
  const forms = allForms.filter(([tag]) => /\bid=["']quote["']/i.test(tag));
  const quoteMethod = forms[0]?.[0].match(/\bmethod=["']([^"']+)/i)?.[1] ?? null;
  return {
    id, type, status: response.status, guarded, hasPolicy: Boolean(csp),
    html: /^text\/html\b/i.test(heading),
    json: /^application\/json\b/i.test(heading),
    forms: forms.length, allForms: allForms.length, quoteMethod,
    nosniff: response.headers.get("x-content-type-options") === "nosniff",
  };
}));
console.log(JSON.stringify(rows));

for (const result of rows) {
  assert.equal(result.status, 200, result.id);
  const shouldBeGuarded = (expectedMode !== "baseline" && result.type === "form") ||
    (expectedMode === "coverage-after" && result.type === "additional");
  assert.equal(result.guarded, shouldBeGuarded, result.id);
  if (result.type === "form" || result.type === "additional") {
    assert.ok(result.html && result.forms === 1 && result.allForms === 1, result.id + " quote page");
  } else if (result.type === "api") {
    assert.ok(result.json, result.id + " JSON health response");
  }
}
