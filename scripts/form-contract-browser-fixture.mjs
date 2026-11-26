import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { createServer } from "node:http";
import { createServer as createProbe } from "node:net";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const driverFolder = process.env.EDGEWEBDRIVER;
assert.ok(driverFolder, "Run this fixture where Edge WebDriver is already installed");
const driverPath = join(driverFolder, "msedgedriver.exe");
await access(driverPath);

const invented = { name: "Example Visitor", email: "fixture@example.invalid", description: "Fictional project" };
const writes = [];
const unexpected = [];
const fixture = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Local form fixture</title>
<p role="status">The form is loading.</p>
<fieldset disabled>
  <form id="sample" method="post">
    <label>Name <input name="name"></label>
    <label>Email <input name="email" type="email"></label>
    <fieldset><legend>Project</legend><label>Description <textarea name="description"></textarea></label></fieldset>
    <button type="submit">Send</button>
  </form>
</fieldset>
<script>
  const form = document.querySelector("#sample");
  let ready = false;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!ready) return;
    const response = await fetch("/receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    if (response.ok) document.body.dataset.result = "accepted";
  });
  ready = true;
  form.parentElement.disabled = false;
  document.querySelector('[role="status"]').hidden = true;
</script>`;

const fixtureServer = createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(fixture);
    return;
  }
  if (request.method === "GET" && request.url === "/favicon.ico") {
    response.writeHead(204).end();
    return;
  }
  if (request.method === "POST" && request.url === "/receipt") {
    let body = "";
    for await (const chunk of request) body += chunk;
    try {
      writes.push(JSON.parse(body));
      response.writeHead(200).end();
    } catch {
      response.writeHead(400).end();
    }
    return;
  }
  unexpected.push({ method: request.method, hasQuery: request.url.includes("?") });
  response.writeHead(404).end();
});

const listen = (server) => new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => resolve(server.address().port));
});
const origin = "http://127.0.0.1:" + await listen(fixtureServer);
const probe = createProbe();
const driverPort = await listen(probe);
await new Promise((resolve) => probe.close(resolve));
const endpoint = "http://127.0.0.1:" + driverPort;
const driver = spawn(driverPath, ["--port=" + driverPort], { windowsHide: true, stdio: "ignore" });
let session = null;
let driverError = null;
driver.on("error", (error) => { driverError = error; });

async function rpc(verb, route, body) {
  const reply = await fetch(endpoint + route, {
    method: verb,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  const payload = await reply.json();
  if (!reply.ok || payload.value?.error) throw new Error(payload.value?.message ?? "Driver error");
  return payload.value;
}

async function waitFor(read, label) {
  const expires = Date.now() + 10000;
  do {
    if (driverError) throw driverError;
    try { if (await read()) return; } catch { /* Retry while the browser starts. */ }
    await delay(80);
  } while (Date.now() < expires);
  throw new Error("Timed out waiting for " + label);
}

async function open(jsAllowed) {
  const active = await rpc("POST", "/session", { capabilities: { alwaysMatch: {
    browserName: "MicrosoftEdge",
    "ms:edgeOptions": {
      args: ["--headless=new", "--disable-background-networking", "--no-first-run", "--window-size=390,844"],
      prefs: { "profile.managed_default_content_settings.javascript": jsAllowed ? 1 : 2 },
    },
  } } });
  session = "/session/" + active.sessionId;
  await rpc("POST", session + "/url", { url: origin + "/" });
}

const run = (script, args = []) => rpc("POST", session + "/execute/sync", { script, args });

async function closeBrowser() {
  if (!session) return;
  const active = session;
  session = null;
  await rpc("DELETE", active);
}

async function clickSubmit() {
  const found = await rpc("POST", session + "/element", { using: "css selector", value: "button[type=submit]" });
  const id = found["element-6066-11e4-a52e-4f735466cecf"];
  try {
    await rpc("POST", session + "/element/" + id + "/click", {});
  } catch (error) {
    if (!String(error).includes("not interactable")) throw error;
  }
}

try {
  await waitFor(async () => (await rpc("GET", "/status")).ready, "WebDriver");
  await open(false);
  const cold = await run(`
    const form = document.querySelector("#sample");
    for (const [name, value] of Object.entries(arguments[0])) form.elements[name].value = value;
    return {
      method: form.method,
      disabled: [...form.querySelectorAll("input, textarea, button")].every((item) => item.matches(":disabled")),
      serialized: [...new FormData(form).keys()],
      notice: document.querySelector('[role="status"]').hidden === false,
    };
  `, [invented]);
  assert.deepEqual(cold, { method: "post", disabled: true, serialized: [], notice: true });
  await clickSubmit();
  assert.equal(await rpc("GET", session + "/url"), origin + "/");
  assert.deepEqual(writes, []);
  assert.deepEqual(unexpected, []);
  console.log("PASS: JavaScript disabled, all contact controls disabled, no serialized values and no form request");
  await closeBrowser();

  await open(true);
  await waitFor(() => run("return !document.querySelector('#sample button').matches(':disabled')"), "script-ready form");
  await run(`
    const form = document.querySelector("#sample");
    for (const [name, value] of Object.entries(arguments[0])) form.elements[name].value = value;
  `, [invented]);
  await clickSubmit();
  await waitFor(() => run("return document.body.dataset.result === 'accepted'"), "local receipt");
  assert.deepEqual(writes, [invented]);
  assert.deepEqual(unexpected, []);
  assert.equal(await rpc("GET", session + "/url"), origin + "/");
  console.log("PASS: JavaScript ready, receiver got exactly one JSON POST and the page URL stayed unchanged");
} finally {
  try { await closeBrowser(); } finally {
    driver.kill();
    fixtureServer.closeAllConnections();
    fixtureServer.close();
  }
}
