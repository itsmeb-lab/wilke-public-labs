import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const targets = {
  main: {
    origin: "https://wilkeservices.com",
    pathname: "/property/estate-rental-cleanouts",
    service: "estate-rental-cleanouts",
    zip: "53202",
  },
  milwaukee: {
    origin: "https://milwaukee-hardwood.vercel.app",
    pathname: "/milwaukee/hardwood-flooring",
    service: "hardwood-sanding-refinishing",
    zip: "53202",
  },
};
const mode = process.argv[2];
assert.ok(Object.hasOwn(targets, mode));
const target = targets[mode];
const search = "?utm_source=route-replay&utm_medium=fixture&utm_campaign=browser-check";
const dummy = {
  "#q-name": "Example Visitor",
  "#q-phone": "2025550100",
  "#q-email": "fixture@example.invalid",
  "#q-city": target.zip,
  "#q-desc": "Fictional job description for a local browser test.",
};
const receipt = "FIXTURE-REFERENCE";
const posts = [];
const unexpectedNavigations = [];
const upstreamReads = new Map();
const skippedPaths = new Set();
let receivedPolicy = false;
let port;

const localServer = http.createServer(async (req, res) => {
  const address = new URL(req.url, "http://127.0.0.1:" + port);
  if (req.method === "POST" && address.pathname === "/api/quote" && !address.search) {
    let text = "";
    for await (const part of req) {
      text += part;
      if (text.length > 24000) {
        res.writeHead(413).end();
        return;
      }
    }
    try {
      posts.push(JSON.parse(text));
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: true, submissionId: receipt, fulfillmentModel: "PARTNER" }));
    } catch {
      res.writeHead(400).end();
    }
    return;
  }
  if (req.method !== "GET") {
    res.writeHead(405).end();
    return;
  }
  if (address.pathname === target.pathname && address.search !== search) {
    unexpectedNavigations.push([...address.searchParams.keys()]);
    res.writeHead(400).end();
    return;
  }
  const isPage = address.pathname === target.pathname;
  const isAsset = /^\/assets\/[\w./-]+\.(?:js|mjs|css|woff2?|svg|png|webp|jpe?g)$/i.test(address.pathname);
  if (address.origin !== "http://127.0.0.1:" + port || (!isPage && !isAsset)) {
    skippedPaths.add(address.pathname);
    res.writeHead(404).end();
    return;
  }
  // This is the only path that can contact production. It builds a new GET
  // from an allowlisted document or asset path. Browser headers and bodies stay local.
  const upstream = new URL(address.pathname + address.search, target.origin);
  try {
    let fetched = upstreamReads.get(upstream.href);
    if (!fetched) {
      fetched = (async () => {
        const response = await fetch(upstream, {
          method: "GET",
          redirect: "error",
          signal: AbortSignal.timeout(12000),
        });
        const policy = response.headers.get("content-security-policy") ?? "";
        if (isPage) receivedPolicy = /(?:^|[;,])\s*form-action\s+'none'\s*(?:;|,|$)/i.test(policy);
        const headers = { "content-type": response.headers.get("content-type") ?? "application/octet-stream" };
        if (policy) headers["content-security-policy"] = policy;
        return { status: response.status, headers, bytes: Buffer.from(await response.arrayBuffer()) };
      })();
      upstreamReads.set(upstream.href, fetched);
    }
    const item = await fetched;
    res.writeHead(item.status, item.headers).end(item.bytes);
  } catch {
    res.writeHead(502).end();
  }
});

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
}

port = await listen(localServer);
const probe = http.createServer();
const driverPort = await listen(probe);
await new Promise((resolve) => probe.close(resolve));
const endpoint = "http://127.0.0.1:" + driverPort;
const localPage = "http://127.0.0.1:" + port + target.pathname + search;
const driverPath = join(process.env.EDGEWEBDRIVER ?? ".", "msedgedriver.exe");
await access(driverPath);
const driver = spawn(driverPath, ["--port=" + driverPort], { windowsHide: true, stdio: "ignore" });
let driverError = null;
driver.on("error", (error) => { driverError = error; });
let session;

async function rpc(verb, path, body) {
  const response = await fetch(endpoint + path, {
    method: verb,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(14000),
  });
  const result = await response.json();
  if (!response.ok || result.value?.error) throw new Error(result.value?.message ?? "Driver error");
  return result.value;
}

async function until(predicate, label, timeout = 14000) {
  const deadline = Date.now() + timeout;
  do {
    if (driverError) throw driverError;
    try {
      const outcome = await predicate();
      if (outcome) return outcome;
    } catch { /* Wait while the document or driver starts. */ }
    await delay(100);
  } while (Date.now() < deadline);
  throw new Error("Timed out waiting for " + label);
}

async function open(javascript) {
  const caps = await rpc("POST", "/session", { capabilities: { alwaysMatch: {
    browserName: "MicrosoftEdge",
    "ms:edgeOptions": {
      args: [
        "--headless=new", "--no-first-run", "--disable-background-networking", "--disable-extensions",
        "--proxy-server=http://127.0.0.1:9", "--window-size=900,860",
      ],
      prefs: { "profile.managed_default_content_settings.javascript": javascript ? 1 : 2 },
    },
  } } });
  session = "/session/" + caps.sessionId;
  await rpc("POST", session + "/url", { url: localPage });
}

async function close() {
  if (!session) return;
  const id = session;
  session = null;
  await rpc("DELETE", id);
}

const run = (script, args = []) => rpc("POST", session + "/execute/sync", { script, args });
const present = (selector) => run("return Boolean(document.querySelector(arguments[0]));", [selector]);
async function element(selector) {
  const result = await until(async () => rpc("POST", session + "/element", { using: "css selector", value: selector }), selector);
  return session + "/element/" + result["element-6066-11e4-a52e-4f735466cecf"];
}
async function put(selector, text) {
  await rpc("POST", await element(selector) + "/value", { text, value: [...text] });
}
async function click(selector) {
  // Center the control so a persistent navigation bar cannot occlude the click.
  await run("document.querySelector(arguments[0]).scrollIntoView({block:'center'});", [selector]);
  await rpc("POST", await element(selector) + "/click", {});
}

const form = "form#quote";
const submit = form + " button[type=submit]";
try {
  await until(async () => (await rpc("GET", "/status")).ready, "WebDriver");
  await open(false);
  await until(() => present(form), "public quote markup");
  assert.ok(receivedPolicy, "The public document must serve the protective header");
  await run("for (const [selector,value] of Object.entries(arguments[0])) {document.querySelector(selector).value=value;}", [dummy]);
  await click(submit);
  assert.equal(await rpc("GET", session + "/url"), localPage);
  assert.deepEqual(unexpectedNavigations, []);
  assert.equal(posts.length, 0);
  console.log(mode + " no-JavaScript form made no request with dummy data");
  await close();

  await open(true);
  await until(() => present(form + '[data-hydrated="true"]'), "production quote bundle hydration", 28000);
  if (await present("#q-aud")) {
    await run("const select=document.querySelector('#q-aud');if(!select.value){select.value='residential';select.dispatchEvent(new Event('change',{bubbles:true}));}");
  }
  for (const [selector, value] of Object.entries(dummy)) await put(selector, value);
  await click(submit);
  await until(() => present("#q-consent-error"), "visible consent validation");
  assert.equal(posts.length, 0);
  await click("#q-consent");
  if (await present("#q-partner-consent")) await click("#q-partner-consent");
  await click(submit);
  await until(() => run("return document.body.innerText.includes(arguments[0]);", [receipt]), "local quote receipt");
  assert.equal(posts.length, 1);
  assert.equal(posts[0].email, dummy["#q-email"]);
  assert.equal(posts[0].serviceId, target.service);
  assert.equal(posts[0].consent, true);
  assert.equal(posts[0].utmSource, "route-replay");
  assert.equal(posts[0].utmMedium, "fixture");
  assert.equal(posts[0].utmCampaign, "browser-check");
  assert.ok(posts[0].idempotencyKey);
  assert.equal(await rpc("GET", session + "/url"), localPage);
  assert.deepEqual(unexpectedNavigations, []);
  console.log(JSON.stringify({
    case: mode, browserPolicyPresent: true, upstreamReadCount: upstreamReads.size,
    blockedLocalResourceCount: skippedPaths.size, javascriptDisabledRequests: 0,
    localReceipts: 1, consentChecked: true, referralFieldsPresent: 3, productionPostCount: 0,
  }));
} catch (error) {
  const details = await (session ? run(`
    const form = document.querySelector('form#quote');
    return {hydrated:form?.dataset.hydrated,quoteStatus:form?.dataset.quoteStatus,
      errorIds:Array.from(document.querySelectorAll('[role=alert][id]')).map(e=>e.id)};
  `).catch(() => null) : null);
  console.error(JSON.stringify({
    case: mode, issue: error.message.split("\n")[0], details,
    upstreamReadCount: upstreamReads.size, blockedAssetPaths: [...skippedPaths].slice(0, 10),
  }));
  process.exitCode = 1;
} finally {
  try { await close(); } finally {
    driver.kill();
    localServer.closeAllConnections();
    localServer.close();
  }
}
