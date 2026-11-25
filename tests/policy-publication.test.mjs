import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { catalog } from "../published-policy-lab/data.mjs";
const html=readFileSync(new URL("../published-policy-lab/index.html",import.meta.url),"utf8");
const app=readFileSync(new URL("../published-policy-lab/app.mjs",import.meta.url),"utf8");
const engine=readFileSync(new URL("../published-policy-lab/engine.mjs",import.meta.url),"utf8");
const canonical="https://itsmeb-lab.github.io/wilke-public-labs/published-policy-lab/";
test("policy page has one untracked canonical, title, description and heading",()=>{
 assert.deepEqual([...html.matchAll(/<link rel="canonical" href="([^"]+)">/g)].map(m=>m[1]),[canonical]);
 assert.equal([...html.matchAll(/<title>[^<]+<\/title>/g)].length,1);
 assert.equal([...html.matchAll(/<meta name="description" content="[^"]+">/g)].length,1);
 assert.equal([...html.matchAll(/<h1\b/g)].length,1);
 assert.ok(html.includes('<meta property="og:url" content="'+canonical+'">'));
});
test("policy page uses existing local module and stylesheet assets",()=>{
 for(const path of ["../published-policy-lab/app.mjs","../published-policy-lab/style.css","../published-policy-lab/data.mjs","../published-policy-lab/engine.mjs"])assert.ok(existsSync(new URL(path,import.meta.url)));
 assert.match(html,/<script type="module" src="\.\/app\.mjs\?v=\d{8}-v\d+"><\/script>/);
 assert.match(html,/<link rel="stylesheet" href="\.\/style\.css\?v=\d{8}-v\d+">/);
 assert.doesNotMatch(html,/<script[^>]+src="https?:/i);
});
test("policy page has explicit source-date, limited-coverage and availability boundaries",()=>{
 assert.match(html,/Sources checked November 25, 2026/);
 assert.match(html,/limited example set/);
 assert.match(html,/not a complete directory or a live booking service/);
 assert.match(html,/no document upload, account, payment or added analytics/);
 assert.doesNotMatch(html,/noindex|guaranteed traffic|official directory|<form\b/i);
});
test("policy checker introduces no network, storage or HTML-injection sinks",()=>{
 assert.doesNotMatch(app+"\n"+engine,/fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|\.innerHTML\s*=|insertAdjacentHTML|document\.write/);
 assert.match(app,/node\.textContent=String\(text\)/);
});
test("policy controls have unique identifiers, labels and a live result region",()=>{
 for(const id of ["task","place","visit-date"]) {
  assert.equal([...html.matchAll(new RegExp('id="'+id+'"',"g"))].length,1);
  assert.ok(html.includes('for="'+id+'"'));
 }
 assert.match(html,/id="answer" role="status" aria-live="polite"/);
 assert.match(html,/class="skip" href="#checker"/);
});
test("published example counts match the checked snapshot",()=>{
 assert.equal(catalog.places.length,13);
 assert.equal(new Set(catalog.places.map(p=>p.region)).size,3);
 assert.equal(catalog.sources.length,13);
});
test("policy utility has no compulsory sales, account or payment route",()=>{
 assert.doesNotMatch(html,/data-diagnostic-link|checkout|square\.link|type="password"|mailto:/i);
 assert.ok(html.includes('href="../"'));
});
