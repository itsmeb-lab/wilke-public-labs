import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { catalog } from "../published-policy-lab/data.mjs";
import { renderPolicySnapshot } from "../published-policy-lab/snapshot.mjs";
const html=readFileSync(new URL("../published-policy-lab/index.html",import.meta.url),"utf8").replace(/\r\n/g,"\n");
test("saved no-script policy snapshot exactly matches the reviewed catalog",()=>{
 const saved=html.split("<!-- POLICY-SNAPSHOT:START -->\n")[1]?.split("\n<!-- POLICY-SNAPSHOT:END -->")[0];
 assert.equal(saved,renderPolicySnapshot(catalog));
});
test("static policy snapshot includes all 29 task-place/program joins once",()=>{
 const markup=renderPolicySnapshot(catalog);
 const expected=catalog.places.flatMap(place=>Object.keys(place.policies).map(task=>place.id+":"+task)).sort();
 const actual=[...markup.matchAll(/data-policy="([^"]+)"/g)].map(match=>match[1]).sort();
 assert.equal(expected.length,29);assert.deepEqual(actual,expected);
 assert.equal((markup.match(/class="policy-card"/g)||[]).length,13);
});
test("static policy snapshot retains named jurisdictions and honest unknowns",()=>{
 const markup=renderPolicySnapshot(catalog);
 assert.match(markup,/Morehead, KY/);assert.match(markup,/Henderson, NC/);
 assert.match(markup,/Detail unknown/);assert.match(markup,/Live availability remains unverified/);
 assert.doesNotMatch(markup,/open now|guaranteed acceptance|Posted notary window/);
});
test("static policy snapshot escapes data as text and cannot inject markup",()=>{
 const copy=structuredClone(catalog);
 copy.places[0].name='A <script>alert("x")</script> & " B';
 copy.places[0].policies.electronics.summary="<img src=x onerror=alert(1)>";
 const markup=renderPolicySnapshot(copy);
 assert.ok(markup.includes("&lt;script&gt;"));assert.ok(markup.includes("&lt;img"));
 assert.doesNotMatch(markup,/<script|<img|onerror="|onclick="/i);
});
test("static policy snapshot refuses an unsafe source URL",()=>{
 const copy=structuredClone(catalog);copy.sources[0].url="javascript:alert(1)";
 assert.throws(()=>renderPolicySnapshot(copy),/Invalid source record/);
});
test("excluded and unstated tasks cannot inherit a fee from malformed extra data",()=>{
 const copy=structuredClone(catalog);
 copy.places[0].policies.farmer_oil.fee="WRONG RESTRICTED FEE";
 copy.places[0].policies.paint.fee="WRONG UNKNOWN FEE";
 const markup=renderPolicySnapshot(copy);
 assert.doesNotMatch(markup,/WRONG RESTRICTED FEE|WRONG UNKNOWN FEE/);
 assert.match(markup,/\$0\.20 per page/);
});

test("static program entries carry scope notes instead of street-address claims",()=>{
 const markup=renderPolicySnapshot(catalog);
 assert.equal((markup.match(/Program rules ·/g)||[]).length,6);
 assert.equal((markup.match(/Program-level rules\./g)||[]).length,6);
 assert.match(markup,/Mecklenburg County, NC/);
});
